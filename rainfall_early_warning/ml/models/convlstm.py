import torch
import torch.nn as nn

class ConvLSTMCell(nn.Module):
    def __init__(self, input_dim, hidden_dim, kernel_size, bias):
        super(ConvLSTMCell, self).__init__()

        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.kernel_size = kernel_size
        self.padding = kernel_size[0] // 2, kernel_size[1] // 2
        self.bias = bias
        
        self.conv = nn.Conv2d(in_channels=self.input_dim + self.hidden_dim,
                              out_channels=4 * self.hidden_dim,
                              kernel_size=self.kernel_size,
                              padding=self.padding,
                              bias=self.bias)

    def forward(self, input_tensor, cur_state):
        h_cur, c_cur = cur_state
        combined = torch.cat([input_tensor, h_cur], dim=1)  # concatenate along channel axis
        
        combined_conv = self.conv(combined)
        cc_i, cc_f, cc_o, cc_g = torch.split(combined_conv, self.hidden_dim, dim=1) 
        
        i = torch.sigmoid(cc_i)
        f = torch.sigmoid(cc_f)
        o = torch.sigmoid(cc_o)
        g = torch.tanh(cc_g)
        
        c_next = f * c_cur + i * g
        h_next = o * torch.tanh(c_next)
        
        return h_next, c_next

    def init_hidden(self, batch_size, image_size):
        height, width = image_size
        return (torch.zeros(batch_size, self.hidden_dim, height, width, device=self.conv.weight.device),
                torch.zeros(batch_size, self.hidden_dim, height, width, device=self.conv.weight.device))


class ConvLSTM(nn.Module):
    """
    ConvLSTM architecture for spatial-temporal sequence forecasting.
    Expects input of shape (batch, time, channel, height, width).
    """
    def __init__(self, input_dim, hidden_dim, kernel_size, num_layers, batch_first=True, bias=True):
        super(ConvLSTM, self).__init__()

        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.kernel_size = kernel_size
        self.num_layers = num_layers
        self.batch_first = batch_first

        # Ensure hidden_dim is a list
        if not isinstance(hidden_dim, list):
            self.hidden_dim = [hidden_dim] * self.num_layers
        else:
            self.hidden_dim = hidden_dim

        cell_list = []
        for i in range(self.num_layers):
            cur_input_dim = self.input_dim if i == 0 else self.hidden_dim[i - 1]
            cell_list.append(ConvLSTMCell(input_dim=cur_input_dim,
                                          hidden_dim=self.hidden_dim[i],
                                          kernel_size=(self.kernel_size, self.kernel_size),
                                          bias=bias))
        self.cell_list = nn.ModuleList(cell_list)

    def forward(self, input_tensor, hidden_state=None):
        """
        Parameters
        ----------
        input_tensor: 5-D Tensor of shape (b, t, c, h, w)
        """
        if not self.batch_first:
            # (t, b, c, h, w) -> (b, t, c, h, w)
            input_tensor = input_tensor.permute(1, 0, 2, 3, 4)

        b, t, _, h, w = input_tensor.size()

        if hidden_state is None:
            hidden_state = self._init_hidden(batch_size=b, image_size=(h, w))

        layer_output_list = []
        last_state_list = []

        seq_len = input_tensor.size(1)
        cur_layer_input = input_tensor

        for layer_idx in range(self.num_layers):
            h, c = hidden_state[layer_idx]
            output_inner = []
            for t in range(seq_len):
                h, c = self.cell_list[layer_idx](input_tensor=cur_layer_input[:, t, :, :, :],
                                                 cur_state=[h, c])
                output_inner.append(h)

            layer_output = torch.stack(output_inner, dim=1)
            cur_layer_input = layer_output

            layer_output_list.append(layer_output)
            last_state_list.append([h, c])

        return layer_output_list, last_state_list

    def _init_hidden(self, batch_size, image_size):
        init_states = []
        for i in range(self.num_layers):
            init_states.append(self.cell_list[i].init_hidden(batch_size, image_size))
        return init_states


class RainfallForecaster(nn.Module):
    def __init__(self, config):
        super(RainfallForecaster, self).__init__()
        in_ch = config['model']['input_channels']
        hidden_ch = config['model']['hidden_channels']
        k_size = config['model']['kernel_size']
        n_layers = config['model']['num_layers']
        self.forecast_horizon = config['model']['forecast_horizon']

        self.convlstm = ConvLSTM(input_dim=in_ch,
                                 hidden_dim=hidden_ch,
                                 kernel_size=k_size,
                                 num_layers=n_layers,
                                 batch_first=True)
                                 
        # Output layer maps the final hidden states to the required channels (1 for rainfall)
        self.conv_out = nn.Conv2d(in_channels=hidden_ch[-1], out_channels=in_ch, kernel_size=1)
        
    def forward(self, x):
        """
        x shape: [batch, time, channel, h, w]
        output shape: [batch, forecast_horizon, channel, h, w]
        """
        layer_output_list, last_state_list = self.convlstm(x)
        
        # We only care about the last output from the last layer
        last_hidden = last_state_list[-1][0]  # shape: [B, C, H, W]
        
        out = self.conv_out(last_hidden)      # shape: [B, 1, H, W]
        
        # For simplicity, if forecast_horizon > 1, we could feed this back into a decoder
        # Since horizon is 1, we just return it with an added time dimension
        out = out.unsqueeze(1)                # shape: [B, 1, 1, H, W]
        return out

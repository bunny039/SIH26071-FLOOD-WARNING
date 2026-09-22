"""
Improved Sentinel-1 SAR Flood Segmentation U-Net Architecture
============================================================
Source: Flood-Monitoring-and-Prediction-Using-Satellite-Data-main/notebook/
        Flood_Monitoring_and_Prediction_Using_Satellite_Data.ipynb (Section 4, Cells 1-3)

Architecture Specifications:
  - Input: (Batch, 512, 512, 2)  [VV and VH polarization channels in dB normalized to [0, 1]]
  - Encoder: 4 stages [64, 128, 256, 512] with BatchNorm, ReLU, and MaxPooling
  - Bottleneck: 1024 filters with Dropout (0.3)
  - Decoder: 4 stages [512, 256, 128, 64] with Bilinear Upsampling + Skip Connections
  - Output: Conv2D(1, 1, activation='sigmoid') -> (Batch, 512, 512, 1) flood probability
  - Loss: Combined weighted Dice + BCE loss
  - Total Parameters: ~31,043,969
"""

import os
from typing import Any


# ------------------------------------------------------------------------------
# 1. Custom Loss & Segmentation Metrics
# ------------------------------------------------------------------------------

def dice_loss(y_true, y_pred, smooth=1e-6):
    """Dice loss optimizing direct spatial overlap."""
    import tensorflow as tf
    y_true_f = tf.cast(tf.reshape(y_true, [-1]), tf.float32)
    y_pred_f = tf.cast(tf.reshape(y_pred, [-1]), tf.float32)
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    dice = (2.0 * intersection + smooth) / (
        tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) + smooth
    )
    return 1.0 - dice


def weighted_dice_bce_loss(y_true, y_pred):
    """
    Combined weighted Dice + BCE loss matching research paper.
    50% Binary Cross Entropy + 50% Dice Loss.
    """
    import tensorflow as tf
    smooth = 1e-6
    y_true_f = tf.cast(tf.reshape(y_true, [-1]), tf.float32)
    y_pred_f = tf.reshape(y_pred, [-1])

    bce = tf.keras.losses.binary_crossentropy(y_true_f, y_pred_f)
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    dice_coef = (2.0 * intersection + smooth) / (
        tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) + smooth
    )
    dice = 1.0 - dice_coef

    return 0.5 * bce + 0.5 * dice


def dice_coefficient(y_true, y_pred, smooth=1e-6):
    """Dice coefficient metric (= F1 score for binary segmentation)."""
    import tensorflow as tf
    y_true_f = tf.cast(tf.reshape(y_true, [-1]), tf.float32)
    y_pred_f = tf.cast(
        tf.reshape(tf.cast(y_pred > 0.5, tf.float32), [-1]), tf.float32
    )
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    return (2.0 * intersection + smooth) / (
        tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) + smooth
    )


def iou_score(y_true, y_pred, smooth=1e-6):
    """Intersection over Union (Jaccard Index) metric."""
    import tensorflow as tf
    y_true_f = tf.cast(tf.reshape(y_true, [-1]), tf.float32)
    y_pred_f = tf.cast(
        tf.reshape(tf.cast(y_pred > 0.5, tf.float32), [-1]), tf.float32
    )
    intersection = tf.reduce_sum(y_true_f * y_pred_f)
    union = tf.reduce_sum(y_true_f) + tf.reduce_sum(y_pred_f) - intersection
    return (intersection + smooth) / (union + smooth)


# ------------------------------------------------------------------------------
# 2. Building Blocks
# ------------------------------------------------------------------------------

def conv_block(x, filters, dropout_rate=0.0):
    """Double Conv2D -> BatchNorm -> ReLU block."""
    from tensorflow.keras import layers
    x = layers.Conv2D(filters, 3, padding='same', kernel_initializer='he_normal')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)

    x = layers.Conv2D(filters, 3, padding='same', kernel_initializer='he_normal')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation('relu')(x)

    if dropout_rate > 0.0:
        x = layers.Dropout(dropout_rate)(x)
    return x


def encoder_block(x, filters, dropout_rate=0.0):
    """Convolution block followed by 2x2 MaxPooling."""
    from tensorflow.keras import layers
    skip = conv_block(x, filters, dropout_rate)
    pool = layers.MaxPooling2D(2)(skip)
    return skip, pool


def decoder_block(x, skip, filters):
    """Bilinear Upsampling -> Concatenation with skip connection -> Double Conv."""
    from tensorflow.keras import layers
    x = layers.UpSampling2D(2, interpolation='bilinear')(x)
    x = layers.Concatenate()([x, skip])
    x = conv_block(x, filters)
    return x


# ------------------------------------------------------------------------------
# 3. Model Assembly
# ------------------------------------------------------------------------------

def build_unet(input_shape=(512, 512, 2)) -> Any:
    """
    Builds the Improved U-Net model for Sentinel-1 SAR flood segmentation.
    Input:  (512, 512, 2)  - VV and VH radar backscatter bands
    Output: (512, 512, 1)  - Pixel-level flood probability map in [0, 1]
    """
    from tensorflow.keras import layers, Model, Input
    inputs = Input(shape=input_shape, name='sar_input')

    # Encoder
    s1, p1 = encoder_block(inputs, 64)                 # 512 -> 256
    s2, p2 = encoder_block(p1, 128)                    # 256 -> 128
    s3, p3 = encoder_block(p2, 256, dropout_rate=0.1)  # 128 -> 64
    s4, p4 = encoder_block(p3, 512, dropout_rate=0.2)  # 64 -> 32

    # Bottleneck
    b = conv_block(p4, 1024, dropout_rate=0.3)         # 32x32x1024

    # Decoder
    d1 = decoder_block(b, s4, 512)                     # 32 -> 64
    d2 = decoder_block(d1, s3, 256)                    # 64 -> 128
    d3 = decoder_block(d2, s2, 128)                    # 128 -> 256
    d4 = decoder_block(d3, s1, 64)                     # 256 -> 512

    # Output Sigmoid Layer
    outputs = layers.Conv2D(
        1, 1,
        activation='sigmoid',
        name='flood_probability'
    )(d4)

    model = Model(inputs, outputs, name='improved_sentinel1_unet')
    return model

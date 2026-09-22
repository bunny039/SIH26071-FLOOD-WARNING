import json

INPUT = "../benchmark/ClimateTwinBench_Domain.json"
OUTPUT = "../benchmark/ClimateTwinBench_Domain_public.json"

with open(INPUT, "r", encoding="utf-8") as f:
    data = json.load(f)

public_questions = []

for q in data["questions"]:
    public_questions.append({
        "id": q["id"],
        "category": q["category"],
        "subcategory": q["subcategory"],
        "difficulty": q["difficulty"],
        "question": q["question"],
        "options": q["options"]
    })

public_data = {
    "name": data["name"],
    "version": data["version"],
    "n_questions": len(public_questions),
    "questions": public_questions
}

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(public_data, f, indent=2)

print(f"Saved public benchmark to {OUTPUT}")
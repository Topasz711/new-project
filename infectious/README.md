# Infectious Disease Quiz Data

The JSON files in this directory contain data for the Infectious Disease quizzes. There are two types of quizzes in this section: **Theory (MCQ)** and **Lab**.

---

## 1. Theory (MCQ) JSON Structure

The `infectious-theory*.json` files follow the standard Multiple Choice Question (MCQ) format. Each file is an array of question objects.

### MCQ Object Structure

```json
[
  {
    "question": "A string containing the text of the question.",
    "choices": {
      "A": "Text for choice A.",
      "B": "Text for choice B.",
      "C": "Text for choice C.",
      "D": "Text for choice D.",
      "E": "Text for choice E."
    },
    "correctAnswer": "C",
    "reasoning": {
      "correct": "A detailed explanation for why the correct answer is right.",
      "incorrect": {
        "A": "Explanation for why choice A is wrong.",
        "B": "Explanation for why choice B is wrong.",
        "D": "Explanation for why choice D is wrong.",
        "E": "Explanation for why choice E is wrong."
      }
    },
    "imageUrl": "(Optional) A URL to an image relevant to the question.",
    "imageSource": "(Optional) The source of the image."
  }
]
```

### Field Descriptions

*   `question` (String): The question being asked.
*   `choices` (Object): An object containing the key-value pairs for the multiple-choice options.
*   `correctAnswer` (String): The key corresponding to the correct choice in the `choices` object.
*   `reasoning` (Object): Contains explanations for the answers.
    *   `correct` (String): An explanation for the correct answer.
    *   `incorrect` (Object): Explanations for why the other choices are incorrect.
*   `imageUrl` (String, Optional): A URL path to an image for the question.
*   `imageSource` (String, Optional): The source or credit for the image.

---

## 2. Lab Quiz JSON Structure

The `infectious-lab*.json` files have a more complex structure designed for questions with multiple parts, short answers, and keyword matching. Each file is an array of question block objects.

### Lab Question Block Structure

```json
[
  {
    "questionNumber": "1",
    "headerImage": {
      "url": "path/to/image.jpg",
      "source": "Image Source",
      "caption": "(Optional) Caption for the image.",
      "insertAfter": "(Optional) ID of the sub-question to insert this image after."
    },
    "note": "(Optional) A note or special instruction for the entire question block.",
    "subQuestions": [
      {
        "id": "1A",
        "type": "short_answer",
        "prompt": "Text of the sub-question.",
        "imageUrl": "(Optional) URL for an image specific to this sub-question.",
        "imageSource": "(Optional) Source for the sub-question image.",
        "answer": ["Correct Answer"],
        "reasoning": "Explanation for the answer."
      },
      {
        "id": "1B",
        "type": "keywords",
        "prompt": "Another sub-question.",
        "fields": 2,
        "answer": {
          "requiredKeywords": ["keyword1", "keyword2", "keyword3"],
          "requiredCount": 2
        },
        "reasoning": "Explanation for the answer."
      }
    ]
  }
]
```

### Field Descriptions

*   `questionNumber` (String): The main number for the question block (e.g., "1", "2").
*   `headerImage` (Object, Optional): An image that applies to the entire question block.
    *   `url`, `source`, `caption`: Image details.
    *   `insertAfter` (String, Optional): If provided, the image will be inserted after the sub-question with the matching `id`. Otherwise, it appears at the top.
*   `note` (String, Optional): A special note displayed at the top of the question block.
*   `subQuestions` (Array): An array of sub-question objects.
    *   `id` (String): A unique identifier for the sub-question (e.g., "1A", "2B").
    *   `type` (String): The type of sub-question. Can be `short_answer` or `keywords`.
    *   `prompt` (String): The text of the sub-question.
    *   `imageUrl`, `imageSource`: Optional image for the specific sub-question.
    *   `fields` (Number, Optional): For `keywords` type, this specifies how many input fields to render.
    *   `answer`: The correct answer.
        *   For `short_answer`: An array of acceptable string answers.
        *   For `keywords`: An object with `requiredKeywords` (an array of strings) and `requiredCount` (the number of keywords that must be matched).
    *   `reasoning` (String): The explanation for the correct answer.
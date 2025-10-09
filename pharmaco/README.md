# Pharmacology Quiz Data

The JSON files in this directory contain the data for the pharmacology quizzes. All quizzes in this section follow the Multiple Choice Question (MCQ) format.

## MCQ JSON Structure

Each JSON file is an array of question objects. Each object has the following structure:

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
*   `choices` (Object): An object containing the key-value pairs for the multiple-choice options. The key is the letter (e.g., "A"), and the value is the text for that choice.
*   `correctAnswer` (String): The key corresponding to the correct choice in the `choices` object.
*   `reasoning` (Object): Contains explanations for the answers.
    *   `correct` (String): An explanation of why the correct answer is the right choice.
    *   `incorrect` (Object): An object where each key corresponds to an incorrect choice and the value explains why that choice is wrong.
*   `imageUrl` (String, Optional): A URL path to an image that should be displayed with the question.
*   `imageSource` (String, Optional): The source or credit for the image.
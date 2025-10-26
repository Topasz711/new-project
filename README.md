# Topaz Quiz Platform

## 📚 Description

Topaz Quiz is a web-based, single-page application designed for medical students and professionals to test their knowledge across various medical subjects. The platform is built with vanilla JavaScript, HTML, and Tailwind CSS, making it lightweight and easy to use directly in a web browser.

### Features:

*   **Multiple Quiz Categories**: Test your knowledge in specialized subjects, including:
    *   Pharmacology
    *   Infectious Diseases (Theory & Lab)
    *   Epidemiology
*   **Dynamic Quiz Loading**: Quizzes are loaded on demand from JSON data files, making the platform easily extensible.
*   **Interactive Quizzes**: Two types of quizzes are supported:
    *   **MCQ (Multiple Choice Questions)**: Classic multiple-choice format with detailed reasoning for both correct and incorrect answers.
    *   **Lab Quizzes**: Complex questions involving case studies, matching, and short answers.
*   **Progress Tracking**: A real-time progress bar tracks your score, including correct, incorrect, and remaining questions.
*   **Retry Incorrect Questions**: Users can retry only the questions they answered incorrectly, providing an effective study tool.
*   **Dark Mode**: A sleek, user-friendly dark mode for comfortable viewing in low-light conditions.
*   **Snake Mini-Game**: A fun, classic snake game is included as a mini-game to take a break from studying.

## 📂 File Structure

The repository is organized as follows:

```
.
├── epidemiology/     # Contains JSON files for Epidemiology quizzes
├── images/           # Stores images used in the quizzes
├── infectious/       # Contains JSON files for Infectious Disease quizzes
├── pharmaco/         # Contains JSON files for Pharmacology quizzes
├── index.html        # The main entry point for the application
├── main.js           # Core application logic for quiz functions
├── snake.js          # Contains all logic for the Snake mini-game
├── style.css         # Main stylesheet for the application
└── README.md         # This file
```

## Dependencies

This project relies on a few external resources loaded via CDN:

*   **Tailwind CSS**: For all styling and layout.
*   **Google Fonts**: For the 'Inter' and 'Sarabun' typefaces.

These are loaded directly in the `<head>` of the `index.html` file and do not require any installation.

## 🚀 Setup and Usage

No complex setup is required to run this application.

1.  **Clone or download the repository:**
    ```bash
    git clone https://github.com/your-repo/topaz-quiz.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd topaz-quiz
    ```
3.  **Open `index.html` in your web browser:**
    You can do this by double-clicking the `index.html` file in your file explorer or by right-clicking and selecting "Open with" your preferred browser.

That's it! You can now navigate through the topics using the sidebar and start taking quizzes.

## ✍️ Author

This project was created by **Topasz711**. You can find more of their work on [GitHub](https://github.com/Topasz711).
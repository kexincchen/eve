# Eve

Eve is an AI agent for everyday inputs! It can be used to transcribe meetings, lectures, etc. It can also be used to summarize text from a website, a file, a podcast, youtube video, etc. All the inputs can be exported as a text/markdown file.

## Features

- [ ] Fetch the url of the website and extract the text
- [ ] Summarize the text
- [ ] Translate the text
- [ ] Chat with the summary
- [x] Transcribe speech to text
- [x] Live captioning during recording (using Web Speech API)
- [x] Capture complete caption history during recording
- [x] Save transcript as text file

## Tech Stack

- [x] Tailwind CSS
- [x] OpenAI Whisper

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up your OpenAI API key in `.env` file
4. Run the development server with `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Upload an audio file or record directly in the browser
2. Wait for transcription to complete
3. View the transcription and generated summary
4. Optionally translate the content or chat with the AI about the summary
5. Live captions are shown during recording for immediate feedback
6. View the complete caption history during and after recording
7. Download the transcript as a text file after recording is complete

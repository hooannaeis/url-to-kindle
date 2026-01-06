# URL to Kindle

A web application that converts any article URL into a Kindle-friendly format, allowing you to easily send articles to your Kindle device for offline reading.

## 🎯 Purpose

URL to Kindle is designed to help readers save online articles to their Kindle devices with minimal effort. The application:

1. Takes any article URL as input
2. Converts the article content to a clean, readable format
3. Provides options to download or send the article directly to your Kindle

This is perfect for:
- Saving long-form articles for later reading
- Creating a personal reading library on your Kindle
- Reducing screen time by reading on e-ink devices
- Accessing content offline during travel or commutes

## 🚀 Features

- **Simple Interface**: Clean, user-friendly design with a single input field
- **One-Click Conversion**: Convert articles with a single button click
- **Kindle Optimization**: Content is formatted specifically for Kindle devices
- **Web Share API**: Direct sharing to compatible apps (where supported)
- **Fallback Download**: Automatic download option when web sharing isn't available
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend

- **Framework**: [Astro](https://astro.build/) - Modern static site builder
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **UI Features**:
  - Glassmorphism effects for modern aesthetics
  - Smooth animations and transitions
  - Responsive design for all screen sizes
  - Custom CSS animations for user feedback

### Backend

- **Platform**: Firebase Cloud Functions
- **Runtime**: Node.js 24
- **Key Dependencies**:
  - `axios`: For making HTTP requests to external APIs
  - `marked`: For converting Markdown to HTML
  - `firebase-functions`: For Firebase Cloud Functions integration
  - `firebase-admin`: For Firebase administration

### External Services

- **Jina.ai**: Used for article extraction and conversion to Markdown format
- **Firebase Hosting**: For deploying and hosting the web application

## 📁 Project Structure

```
/
├── public/                  # Static assets
├── src/                     # Frontend source code
│   ├── pages/               # Astro pages
│   │   └── index.astro      # Main application page
│   └── styles/              # CSS styles
├── functions/               # Firebase Cloud Functions
│   ├── index.js             # Main backend logic
│   └── package.json         # Backend dependencies
├── firebase.json            # Firebase configuration
├── astro.config.mjs         # Astro configuration
└── package.json             # Frontend dependencies
```

## 📦 Key Components

### Frontend (`src/pages/index.astro`)

The frontend provides a clean, intuitive interface with:

- URL input field for article URLs
- "Convert Article" button to trigger the conversion process
- "Send to Kindle" button that appears after successful conversion
- "Start Over" button to reset the process
- Visual feedback through animations and notifications

### Backend (`functions/index.js`)

The backend handles the conversion process:

1. Receives the article URL from the frontend
2. Fetches the article content from Jina.ai API
3. Extracts the title and author information
4. Adds frontmatter (title, author) to the Markdown
5. Converts Markdown to HTML using the `marked` library
6. Returns the HTML file with appropriate headers for download

## 🔧 Setup & Development

### Prerequisites

- Node.js 24+
- npm or yarn
- Firebase CLI (for deployment)

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd functions
npm install
cd ..
```

### Running Locally

```bash
# Start the Astro development server
npm run dev

# In another terminal, start Firebase emulators
cd functions
npm run serve
```

### Deployment

```bash
# Build the frontend
npm run build

# Deploy to Firebase
firebase deploy
```

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

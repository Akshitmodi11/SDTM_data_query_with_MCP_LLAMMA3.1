# Medical Data Query System 🏥

AI-powered medical data query system using LLaMA 3.1 for natural language to SQL conversion.
Problem: Doctor or CRO needed a data with somekind of data, but researched are not analyst they generally sending email they want adverse event patient data with age 50 or others with this MCP server and LLama this problem is saving  and coctor or researcher can do work independently without breaking a momentum. 

## Features

✅ Natural language queries for clinical trial data  
✅ LLaMA 3.1 powered SQL generation  
✅ Web-based chat interface  
✅ PDF report generation  
✅ Support for CDISC SDTM data format  

## Architecture
```
MCPserver/
├── src/
│   ├── database/       # Database handlers
│   ├── llm/           # LLaMA integration
│   └── utils/         # PDF generation
├── public/            # Web interface
├── xptfiles/          # XPT data files
└── web_server.js      # Express server
```

## Installation

### Prerequisites
- Node.js 18+
- Python 3.8+
- Ollama with LLaMA 3.1

### Setup

1. **Clone the repository**
```bash
   git clone <your-repo-url>
   cd MCPserver
```

2. **Install Node dependencies**
```bash
   npm install
```

3. **Install Python dependencies**
```bash
   pip install pandas
```

4. **Install Ollama**
```bash
   brew install ollama
   ollama pull llama3.1
```

5. **Convert XPT files to CSV**
```bash
   python3 convert_xpt.py
```

6. **Import data to SQLite**
```bash
   node import_to_db.js
```

## Usage

### Start Ollama (Terminal 1)
```bash
ollama serve
```

### Start Web Server (Terminal 2)
```bash
node web_server.js
```

### Open Browser
Navigate to: `http://localhost:3000`

## Example Queries

-"give me data with from DEMOGRAPHIC table"
- "Find patients over 65 with adverse event"
- "Show serious adverse events"
- "Get patients with diabetes"
- "Show lab results for female patients"

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite
- **AI Model**: LLaMA 3.1 via Ollama
- **Frontend**: Vanilla HTML/CSS/JS
- **PDF Generation**: pdf-lib

## Data Format

Supports CDISC SDTM clinical trial data:
- **AE** - Adverse Events
- **DM** - Demographics
- **LB** - Laboratory
- **VS** - Vital Signs
- **CM** - Concomitant Medications
- **MH** - Medical History

## License



## Author

Built with SDTM for medical research. 

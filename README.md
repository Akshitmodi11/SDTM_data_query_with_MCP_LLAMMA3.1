# Medical Data Query System 

Doctors, researchers, and CROs frequently require specific datasets—such as "adverse event data for patients over age 50"—but often lack the technical expertise to query databases directly. Consequently, they are forced to email data analysts for these requests, creating a dependency that causes delays and disrupts their research momentum. By implementing an AI-powered query system using LLaMA 3.1 and the Model Context Protocol (MCP), we can bridge this gap. This solution enables non-technical stakeholders to retrieve data independently using natural language, saving time and allowing them to maintain their workflow without interruptions.

## Features

--Natural language queries for clinical trial data  
--LLaMA 3.1 powered SQL generation  
--Web-based chat interface  
--PDF report generation  
--Support for CDISC SDTM data format  

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
   git clone git clone https://github.com/Akshitmodi11/SDTM_data_query_with_MCP_LLAMMA3.1.git
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

##Demo
[![Watch the video](https://img.youtube.com/vi/b_XKeZtKIjU/0.jpg)](https://www.youtube.com/watch?v=b_XKeZtKIjU)


## License



## Author## Demo Video

Akshit Modi

# CricBee - Sports Club Management System

CricBee is a web-based application that allows cricket clubs to manage their players, teams, and tournaments efficiently.

---

## Features

### Admin
- Manage club managers, organizers, and players
- Enable/disable (block/unblock) users


### Club Manager
- Create and manage cricket clubs
- Add players to the club
- Generate unique CricBee IDs for players
- Player search by CricBee ID

### Player
- Create and update profile
- Upload and edit profile photo
- Change password functionality


---

## 🛠️ Tech Stack

| Category | Technology |
|---------|------------|
| Frontend | React JS |
| Backend | Python, FastAPI / 
| Database | PostgreSQL |
| Auth | JWT Authentication |
| Cloud Storage | AWS S3 |

---

## 🔧 Installation & Setup

### Backend Setup

```bash

cd BackEnd/cricBeeproject
python -m venv myenv
myenv\Scripts\activate   # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

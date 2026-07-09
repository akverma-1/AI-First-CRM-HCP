import pymysql
from urllib.parse import urlparse, unquote
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import HCP, Interaction

def setup_database():
    print("Parsing database URL...")
    # Parse database URL
    parsed = urlparse(settings.database_url)
    
    # Extract credentials and host
    username = unquote(parsed.username) if parsed.username else parsed.username
    password = unquote(parsed.password) if parsed.password else parsed.password
    host = parsed.hostname
    port = parsed.port or 3306
    db_name = parsed.path.lstrip("/")

    print(f"Connecting to MySQL server at {host}:{port} as user '{username}'...")
    try:
        # Connect to MySQL server without database first
        conn = pymysql.connect(
            host=host,
            port=port,
            user=username,
            password=password
        )
        cursor = conn.cursor()
        
        # Create database
        print(f"Ensuring database '{db_name}' exists...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.commit()
        cursor.close()
        conn.close()
        print("Database checked/created successfully.")
    except Exception as e:
        print(f"Error checking/creating database: {e}")
        print("Continuing with table creation (assuming database might already exist)...")

    # Now build the tables
    print("Creating tables using SQLAlchemy...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")
        return

    # Seed initial data
    print("Seeding sample HCP data...")
    db = SessionLocal()
    try:
        hcp_count = db.query(HCP).count()
        if hcp_count == 0:
            sample_hcps = [
                HCP(name="Priya Sharma", specialty="Oncology", institution="Apollo Hospitals, Mumbai", engagement_score=9.2),
                HCP(name="Rajesh Gupta", specialty="Cardiology", institution="Fortis Hospital, Delhi", engagement_score=7.8),
                HCP(name="Amit Patel", specialty="Neurology", institution="Zydus Hospital, Ahmedabad", engagement_score=8.5),
                HCP(name="Anjali Nair", specialty="Endocrinology", institution="Amrita Hospital, Kochi", engagement_score=6.9),
                HCP(name="Suresh Kumar", specialty="General Practice", institution="Government General Hospital, Chennai", engagement_score=5.4),
            ]
            db.add_all(sample_hcps)
            db.commit()
            print(f"Successfully seeded {len(sample_hcps)} Healthcare Professionals!")
        else:
            print(f"Database already contains {hcp_count} HCPs. Skipping seeding.")
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_database()

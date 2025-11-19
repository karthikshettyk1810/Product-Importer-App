# Deployment Guide

## Render Deployment

### Prerequisites

- Render account
- GitHub repository

### Steps

1. **Push code to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create Redis Instance on Render**

   - Go to Render Dashboard
   - Click "New +" → "Redis"
   - Name: `product-importer-redis`
   - Plan: Free or Starter
   - Create Redis

3. **Create Web Service**

   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Name: `product-importer-web`
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt && python manage.py migrate`
   - Start Command: `gunicorn product_importer.wsgi:application --bind 0.0.0.0:$PORT`

   **Environment Variables:**

   ```
   SECRET_KEY=<generate-random-secret>
   DEBUG=False
   REDIS_URL=<redis-internal-url-from-step-2>
   CELERY_BROKER_URL=<redis-internal-url-from-step-2>
   ALLOWED_HOSTS=<your-render-url>
   ```

4. **Create Celery Worker Service**

   - Click "New +" → "Background Worker"
   - Connect same repository
   - Name: `product-importer-celery`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `celery -A product_importer worker --loglevel=info`

   **Environment Variables:** (same as web service)

5. **Update requirements.txt for production**
   Add to requirements.txt:
   ```
   gunicorn==21.2.0
   psycopg2-binary==2.9.9  # if using PostgreSQL
   ```

### PostgreSQL Setup (Recommended for Production)

1. **Create PostgreSQL Database on Render**

   - Click "New +" → "PostgreSQL"
   - Name: `product-importer-db`
   - Create Database

2. **Update settings.py**

   ```python
   import dj_database_url

   DATABASES = {
       'default': dj_database_url.config(
           default='sqlite:///db.sqlite3',
           conn_max_age=600
       )
   }
   ```

3. **Add to requirements.txt**

   ```
   dj-database-url==2.1.0
   psycopg2-binary==2.9.9
   ```

4. **Add DATABASE_URL to environment variables**
   Use the Internal Database URL from PostgreSQL instance

---

## Heroku Deployment

### Steps

1. **Install Heroku CLI**

   ```bash
   brew install heroku/brew/heroku  # macOS
   ```

2. **Login and Create App**

   ```bash
   heroku login
   heroku create product-importer-app
   ```

3. **Add Redis**

   ```bash
   heroku addons:create heroku-redis:mini
   ```

4. **Add PostgreSQL** (optional)

   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

5. **Set Environment Variables**

   ```bash
   heroku config:set SECRET_KEY=<your-secret-key>
   heroku config:set DEBUG=False
   ```

6. **Create Procfile**

   ```
   web: gunicorn product_importer.wsgi --log-file -
   worker: celery -A product_importer worker --loglevel=info
   ```

7. **Deploy**

   ```bash
   git push heroku main
   heroku run python manage.py migrate
   ```

8. **Scale Worker**
   ```bash
   heroku ps:scale worker=1
   ```

---

## AWS EC2 Deployment

### Prerequisites

- EC2 instance (Ubuntu 20.04+)
- Security group allowing ports 80, 443, 22

### Steps

1. **SSH into EC2**

   ```bash
   ssh -i your-key.pem ubuntu@<ec2-ip>
   ```

2. **Install Dependencies**

   ```bash
   sudo apt update
   sudo apt install python3-pip python3-venv nginx redis-server
   ```

3. **Clone Repository**

   ```bash
   git clone <your-repo>
   cd product-importer
   ```

4. **Setup Virtual Environment**

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn
   ```

5. **Configure Environment**

   ```bash
   cp .env.example .env
   nano .env  # Edit with production values
   ```

6. **Run Migrations**

   ```bash
   python manage.py migrate
   python manage.py collectstatic
   ```

7. **Setup Systemd Services**

   **/etc/systemd/system/product-importer.service**

   ```ini
   [Unit]
   Description=Product Importer Django
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/product-importer
   Environment="PATH=/home/ubuntu/product-importer/venv/bin"
   ExecStart=/home/ubuntu/product-importer/venv/bin/gunicorn \
             --workers 3 \
             --bind 0.0.0.0:8000 \
             product_importer.wsgi:application

   [Install]
   WantedBy=multi-user.target
   ```

   **/etc/systemd/system/celery.service**

   ```ini
   [Unit]
   Description=Celery Worker
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/product-importer
   Environment="PATH=/home/ubuntu/product-importer/venv/bin"
   ExecStart=/home/ubuntu/product-importer/venv/bin/celery \
             -A product_importer worker --loglevel=info

   [Install]
   WantedBy=multi-user.target
   ```

8. **Start Services**

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start product-importer
   sudo systemctl start celery
   sudo systemctl enable product-importer
   sudo systemctl enable celery
   ```

9. **Configure Nginx**

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /static/ {
           alias /home/ubuntu/product-importer/staticfiles/;
       }
   }
   ```

10. **Restart Nginx**
    ```bash
    sudo systemctl restart nginx
    ```

---

## Docker Deployment

### Using Docker Compose

1. **Build and Run**

   ```bash
   docker-compose up -d
   ```

2. **Run Migrations**

   ```bash
   docker-compose exec web python manage.py migrate
   ```

3. **Create Superuser**
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

### Production Docker Setup

Update docker-compose.yml for production:

- Use PostgreSQL instead of SQLite
- Add nginx service
- Use environment file for secrets
- Configure volumes for persistence

---

## Environment Variables Reference

| Variable          | Description       | Example                             |
| ----------------- | ----------------- | ----------------------------------- |
| SECRET_KEY        | Django secret key | random-50-char-string               |
| DEBUG             | Debug mode        | False                               |
| ALLOWED_HOSTS     | Allowed hosts     | your-domain.com,www.your-domain.com |
| DATABASE_URL      | Database URL      | postgres://user:pass@host:5432/db   |
| REDIS_URL         | Redis URL         | redis://localhost:6379/0            |
| CELERY_BROKER_URL | Celery broker     | redis://localhost:6379/0            |

---

## Post-Deployment Checklist

- [ ] Set DEBUG=False
- [ ] Configure proper SECRET_KEY
- [ ] Set ALLOWED_HOSTS
- [ ] Use PostgreSQL (not SQLite)
- [ ] Configure Redis
- [ ] Run migrations
- [ ] Collect static files
- [ ] Setup SSL certificate
- [ ] Configure backup strategy
- [ ] Setup monitoring
- [ ] Test CSV upload
- [ ] Test webhooks
- [ ] Load test with large CSV

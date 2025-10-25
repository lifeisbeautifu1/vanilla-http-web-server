Build image:

`docker build -t vanilla-http-server:latest .`

Run container:

`docker run -d -e PORT=5000 -p 127.0.0.1:5000:5000 --name vanilla-http-server-app vanilla-http-server`

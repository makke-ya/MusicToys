# pipe host to wsl

netsh.exe interface portproxy add v4tov4 listenaddress=192.168.3.2 listenport=8080 connectaddress=172.18.36.58 connectport=8080
netsh.exe interface portproxy show v4tov4
node subordinate.bin.js --workers 2 --key '$.headers.identifier' --bind 8888 node intake.bin.js &
server=$!

sleep 1

curl -s -H 'identifier: 1' -t 3 http://127.0.0.1:8888
curl -s -t 3 http://127.0.0.1:8888
curl -s -t 3 http://127.0.0.1:8888

echo ----
node socket.bin.js --location 127.0.0.1:8888 --header identifier=1
echo ----

kill $server

rm -rf socket
node subordinate.bin.js --workers 2 --key '$.headers.identifier' --bind ./socket node intake.bin.js &
server=$!

sleep 1

curl --unix-socket ./socket -s -H 'identifier: 1' -t 3 http://127.0.0.1:8888

echo ----
node socket.bin.js --location ./socket --header identifier=1
echo ----

kill $server

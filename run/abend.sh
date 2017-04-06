node subordinate.bin.js --workers 2 --key '$.headers.identifier' --bind 8888 node intake.bin.js &
server=$!

sleep 1

echo '--- running ---'

curl -s -H 'identifier: 1' -t 3 http://127.0.0.1:8888
curl -s -H 'x-abend: 1' -t 3 http://127.0.0.1:8888

wait $server

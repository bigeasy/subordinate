node subordinate.bin.js --workers 0 --bind 8888 node intake.bin.js &
server=$!

sleep 1

echo ----
node socket.bin.js --header x-subordinate-index=1 --header x-intake-reassigned=1
echo ----

kill $server

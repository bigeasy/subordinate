

prolific stdio syslog --wafer prolific.tcp --bind 8808

subordinate ./tmp/subordinate

subordinate ./tmp/subordinate conduit \
    prolific tcp://127.0.0.1:8888 \
    compassion conduit --bind 127.0.0.1:8486

subordinate ./tmp/subordinate mingle \
    prolific tcp://127.0.0.1:8888 \
    mingle subordinate

subordinate ./tmp/subordinate chaperon \
    prolific tcp://127.0.0.1:8888 \
    chaperon --mingle http://127.0.0.1:

subordinate ./tmp/subordinate poster --property name=value \
    prolific tcp://127.0.0.1:8888 \
    emissary poster --turnstiles 24 --wink http://127.0.0.1:8080

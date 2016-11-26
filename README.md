First, install all dependencies in `package.json`

```
npm install
```
Now install the `libpcap` binding.

```
npm install git://github.com/mranney/node_pcap.git
```

Finally, start the server (note that we use `sudo` to sniff all packets).

```
sudo node app.js
```

If you want to read from a pcap file, you can instead do:

```
sudo node app.js --pcap path/to/file.pcap --ffwd 1.0
```

The `--ffwd` parameter is the playback rate. For example, 1.0 is normal playback, 2.0 is 2x speed.

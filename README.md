You'll need `libpcap`. On Ubuntu, you can do this with: 

```
sudo apt-get install libpcap-dev
```

Also, make sure you install [Node.js](https://nodejs.org/en/) (this should also install NPM).

One you've completed the above steps, you can just run `install.sh`, which runs
the steps below.

You'll need the [Handlebars](http://handlebarsjs.com/) command line tool. You
do that with:

```
sudo npm install -g handlebars
```
  
Install all dependencies in `package.json`

```
npm install
```
Now install the `libpcap` binding.

```
npm install git://github.com/mranney/node_pcap.git
```

Finally, start the server
```
npm start
```

If you want to read from a pcap file, you can instead do (the first command
compiles the Handlebars templates):

```
handlebars templates/* -f public/js/templates.js && sudo node app.js --pcap path/to/file.pcap --ffwd 1.0
```

The `--ffwd` parameter is the playback rate. For example, 1.0 is normal playback, 2.0 is 2x speed.

/* const initIpld = (ipfsRepoPath, callback) => {
  const cid = new Cids('QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU');
}); 
export type BlobGetter = (cid: string) => Promise<any>;
*/

export class IpldBlobGetter {
  ipfsClient = null;
  getters = {};

  constructor(ipfsClient, options) {
    this.ipfsClient = ipfsClient;
    this.getters = options.initialGetters;
  }

  setGetter(codec, getter) {
    this.getters[codec] = getter;
  }

  get(cid) {
    const blobCid = new Cids(cid);

    if (!this.getters[blobCid.codec]) {
      return this.ipfsClient.dag.get(cid);
    } else {
      return this.getters[blobCid.codec](cid).then(blob =>
        this.ipfsClient.dag
          .put(blob, { cid: cid })
          .then(() => this.ipfsClient.dag.get(cid))
      );
    }
  }
}

const ipfsClient = window.IpfsHttpClient('gateway.ipfs.io', '5001', );

const p = ipfsClient
  .get('QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU')
  .then(console.log)
  .catch(console.error);
console.log(p);

const getters = {};
const blobGetter = new IpldBlobGetter(ipfsClient, { initialGetters: getters });

const blob = blobGetter.get('QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU');

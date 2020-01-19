const base64Encode = (string) => Buffer.from(string).toString('base64');

class ParamsURL extends URL {
  constructor(href, params, origin = global.location) {
    super(href, origin);
    if (params) this.search = new URLSearchParams([...this.searchParams, ...Object.entries(params)]);
  }
}

module.exports = {
  base64Encode,
  ParamsURL,
};
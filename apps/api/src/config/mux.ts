
import Mux from "@mux/mux-node";

const tokenId = process.env.MUX_TOKEN_ID;
const tokenSecret = process.env.MUX_TOKEN_SECRET;

if (!tokenId || !tokenSecret) {
  throw new Error(
    "Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET in the API environment.",
  );
}

const mux = new Mux({
  tokenId,
  tokenSecret,
});

export default mux;

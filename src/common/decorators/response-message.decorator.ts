import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'mediflow:response-message';

/** Sets the human-readable `message` placed into the success envelope. */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

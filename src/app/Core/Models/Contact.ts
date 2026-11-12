export interface ContactModel {
  access_key: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Spam trap. Real visitors never tick it, and Web3Forms rejects submissions where it is true. */
  botcheck: boolean;
}

export interface Web3FormsResponse {
  success: boolean;
  message: string;
}

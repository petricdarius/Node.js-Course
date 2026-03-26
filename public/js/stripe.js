import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe(
  'pk_test_51TEF8eRoIDhhwJjk9eO6yqkPCjc1hMKAfdcunSFVxXD6iSOxCzyI5fVZkYk1UNY1PDulSh6zP1YXjq2Mhh6vJigg00zKpFPrw9',
);

export const bookTour = async (tourID) => {
  try {
    //1) Get the session from the server
    const session = await axios(`/api/v1/bookings/checkout-session/${tourID}`);

    //2)Create the checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    // console.log(error);
    showAlert('error', error);
  }
};

/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async tourId => {
  //Get checkout session from API
  try {
    const stripe = Stripe(
      'pk_test_51KsreKJeVPqBszZjTonGLtx3xLzFS59mDESiVct8p1kquCcH8dO5WFLif6ScOMLO9KY0FNB7sbsv5JRgPQ5jCmRI00eJPyeIvL'
    );
    const session = await axios({
      method: 'GET',
      url: `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    });
    // Create Checkout form and charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

import gql from "graphql-tag";

export const GET_SHOP_DETAILS = gql`
  query {
    shop {
      name
      id
      email
      billingAddress {
        formatted
      }
    }
  }
`;

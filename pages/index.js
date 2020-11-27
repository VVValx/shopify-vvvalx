// import { Heading, Page } from "@shopify/polaris";

// const Index = () => (
//   <Page>
//     <Heading>Checking the default index</Heading>
//   </Page>
// );

// export default Index;

import React from "react";
import {
  Page,
  Thumbnail,
  Layout,
  Card,
  Stack,
  RadioButton,
  Checkbox,
  Scrollable,
  AccountConnection,
  Heading,
  TextContainer,
  Spinner,
} from "@shopify/polaris";
import { ExternalMinor } from "@shopify/polaris-icons";
/*import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import { GET_SHOP_DETAILS } from '../components/ResourceList';*/
import Cookies from "js-cookie";
import fetch from "node-fetch";
import { dataBase } from "../Firebase";

class Index extends React.Component {
  constructor(props) {
    super(props);
    this.access = Cookies.get("shat");
    this.shopOrigin = Cookies.get("shopOrigin");
    this.state = {
      connected: false,
      shop: null,
      shopInfo: false,
      partner: null,
      partnerInfo: false,
    };
  }

  _configureWebhooks = () => {
    const headerOptions = {
      headers: {},
    };
    const url = "/api/configurewebhooks/webhooks";
    return fetch(url, headerOptions)
      .then((res) => res.json())
      .then((json) => json);
  };

  _deleteWebhooks = () => {
    const headerOptions = {
      headers: {},
    };
    const url = "/api/deletewebhooks/webhooks";
    return fetch(url, headerOptions)
      .then((res) => res.json())
      .then((json) => json);
  };

  _getListOfWebhooks = () => {
    const headerOptions = {
      headers: {},
    };
    const url = "/api/getwebhooks/webhooks";
    return fetch(url, headerOptions)
      .then((res) => res.json())
      .then((json) => json);
  };

  _createFufillmentUpdateWebhook = () => {
    const headerOptions = {
      headers: {},
      method: "get",
    };
    const url = "/api/createfufillmentupdatewebhook/webhooks";
    return fetch(url, headerOptions)
      .then((res) => res.json())
      .then((json) => json);
  };

  _createNewFulfillmentWebhook = () => {
    const headerOptions = {
      headers: {},
      method: "get",
    };
    const url = "/api/createnewfufillmentwebhook/webhooks";
    return fetch(url, headerOptions)
      .then((res) => res.json())
      .then((json) => json);
  };

  _getAllCarrierServices = () => {
    const headerOptions = {
      headers: {},
      method: "get",
    };
    const url = "/api/checkcourierservice/carrier_services";
    return fetch(url, headerOptions)
      .then((res) => res.json())
      .then((json) => json);
  };

  _deleteCarrier = (carrierID) => {
    const headerOptions = {
      headers: {},
      method: "get",
    };
    const url = "/api/deletecourierservice/" + carrierID;
    return fetch(url, headerOptions)
      .then((res) => res.json())
      .then((json) => json);
  };

  _checkDroppxExists = (arrayOfCarriers) => {
    let exists = false;
    arrayOfCarriers.map((carrier) => {
      console.log("****", carrier);
      if (carrier.name === "DroppX") {
        exists = true;
      }
    });
    return exists;
  };

  _onClickConnect = async () => {
    const { partner } = this.state;
    const headerOptions = {
      headers: {
        method: "get",
      },
    };
    const url = "/api/createcourierservice/carrier_services";
    if (this.state.connected) {
      const carrierIdQuery = await this._getAllCarrierServices();
      if (carrierIdQuery.status === "success") {
        const { carrier_services } = carrierIdQuery.data;
        carrier_services.map((carrier) => {
          if (carrier.name === "DroppX") {
            this._deleteCarrier(carrier.id).then((json) => {
              const terms = { ...partner.termsAndConditions };
              delete terms.shopify;
              dataBase
                .collection("users")
                .doc(partner.uid)
                .update({
                  termsAndConditions: terms,
                  shopify: { connected: false },
                })
                .then(async (res) => {
                  await this._deleteWebhooks();
                  this.setState({ connected: false });
                });
            });
          }
        });
      }
    } else {
      const doesCourierServiceExist = await this._getAllCarrierServices();
      const { data } = doesCourierServiceExist;
      if (
        this._checkDroppxExists(data.carrier_services) === false &&
        doesCourierServiceExist.status === "success"
      ) {
        fetch(url, headerOptions)
          .then((res) => res.json())
          .then((json) => {
            const terms = { ...partner.termsAndConditions, shopify: true };
            dataBase
              .collection("users")
              .doc(partner.uid)
              .update({
                termsAndConditions: terms,
                shopify: { connected: true },
              })
              .then(async (res) => {
                await this._configureWebhooks();
                this.setState({ connected: true });
              });
          });
      }
    }
  };

  _getPartnerInfoFromDroppx = async () => {
    const shopName = this.shopOrigin.split(".");
    const partnerQuery = await dataBase
      .collection("users")
      .where("displayName", "==", shopName[0])
      .get();
    const partnerArr = [];
    if (partnerQuery.empty) {
      console.log("No matching documents.");
      return;
    }
    partnerQuery.forEach((partner) => {
      partnerArr.push(partner.data());
    });
    if (partnerArr.length === 1) {
      let connected;
      if (
        partnerArr[0].shopify === undefined ||
        partnerArr[0].shopify.connected === false
      ) {
        connected = false;
      } else {
        connected = true;
      }
      this.setState({
        partner: partnerArr[0],
        partnerInfo: true,
        connected: connected,
      });
    } else {
      alert("Unexpected error");
    }
  };

  _getShopDetailsFromShopify = () => {
    const headerOptions = {
      headers: {
        method: "get",
      },
    };
    const url = "/api/shop";
    fetch(url, headerOptions)
      .then((res) => res.json())
      .then((json) => {
        this.setState({ shop: json.data.shop, shopInfo: true });
      });
  };

  async componentDidMount() {
    if (this.state.shopInfo === false) {
      this._getShopDetailsFromShopify();
    }
    if (this.state.partnerInfo === false) {
      this._getPartnerInfoFromDroppx();
    }
    let carrierQ = await this._getAllCarrierServices();
    const { carrier_services } = carrierQ.data;
    console.log("+++++", await this._checkDroppxExists(carrier_services));
  }

  render() {
    const { connected, shop, partner } = this.state;
    const buttonText = connected ? "Disconnect" : "Connect";
    let details = connected ? "Account connected" : "No account connected";
    const terms = connected ? null : (
      <p>
        By clicking <strong>Connect</strong>, you agree to accept DroppX terms
        and conditions
      </p>
    );

    return (
      <Page
        title="DroppX parcel service"
        separator={true}
        subtitle="Deliver to your customers efficiently and on time"
        secondaryActions={[
          {
            content: "Learn more...",
            icon: ExternalMinor,
            external: true,
            url: "https://www.droppx.com",
          },
        ]}
        thumbnail={
          <Thumbnail
            source="https://firebasestorage.googleapis.com/v0/b/droppx-45ac7.appspot.com/o/droppx%2FImages%2FDroppX-Icon.png?alt=media&token=da2433f8-0a5a-443b-ab6a-c38a2259c6ab"
            alt="Black leather pet collar"
          />
        }
      >
        <Layout>
          <Layout.AnnotatedSection
            title="Store Info"
            description={
              this.state.partner === null ? false : partner.displayName
            }
          >
            <Card sectioned>
              <Stack vertical>
                <RadioButton
                  label="We have a partner account with DroppX"
                  helpText="Only registered partners will be able to use our shopify plugin"
                  checked={this.state.partner !== null}
                  id="partners"
                  name="accounts"
                  onChange={() => console.log("Hello")}
                />
                <RadioButton
                  label="We do not have a partner account with DroppX"
                  helpText="Please follow the link above to register you store as a Droppx partner"
                  id="optional"
                  name="accounts"
                  checked={this.state.partner === null}
                  onChange={() => console.log("Hello")}
                />
              </Stack>
            </Card>
          </Layout.AnnotatedSection>

          <Layout.AnnotatedSection
            title="API Info"
            description="Please keep your API info very safe"
          >
            <Card sectioned>
              {this.state.partner === null ? (
                <Spinner
                  accessibilityLabel="Small spinner example"
                  size="small"
                  color="teal"
                />
              ) : (
                <div>
                  <TextContainer spacing="tight">
                    <Heading>API key</Heading>
                    <p>{partner.apiCredentials.apiKey}</p>
                  </TextContainer>
                  <TextContainer spacing="tight">
                    <Heading>API secret</Heading>
                    <p>
                      ****************************************************************
                    </p>
                  </TextContainer>
                </div>
              )}
            </Card>
          </Layout.AnnotatedSection>
          <Layout.AnnotatedSection
            title="Connect to DroppX parcel service"
            description="Connect to enjoy our services"
          >
            <Card title="Partner integration status" sectioned>
              {this.state.shop === null ? (
                <Spinner
                  accessibilityLabel="Small spinner example"
                  size="small"
                  color="teal"
                />
              ) : (
                <AccountConnection
                  accountName={shop.name}
                  connected={connected}
                  title={shop.name}
                  action={{
                    content: buttonText,
                    onAction: this._onClickConnect,
                  }}
                  details={details}
                  termsOfService={terms}
                />
              )}
            </Card>
          </Layout.AnnotatedSection>

          <Layout.AnnotatedSection
            title="Terms and conditions"
            description="Please accept the terms to be able to proceed"
          >
            <Card title="Terms of service" sectioned>
              <Scrollable shadow style={{ height: "100px" }}>
                <p>
                  By signing up for the Shopify service (“Service”) or any of
                  the services of Shopify Inc. (“Shopify”) you are agreeing to
                  be bound by the following terms and conditions (“Terms of
                  Service”). The Services offered by Shopify under the Terms of
                  Service include various products and services to help you
                  create and manage a retail store, whether an online store
                  (“Online Services”), a physical retail store (“POS Services”),
                  or both. Any new features or tools which are added to the
                  current Service shall be also subject to the Terms of Service.
                  You can review the current version of the Terms of Service at
                  any time at https://www.shopify.com/legal/terms. Shopify
                  reserves the right to update and change the Terms of Service
                  by posting updates and changes to the Shopify website. You are
                  advised to check the Terms of Service from time to time for
                  any updates or changes that may impact you.
                </p>
              </Scrollable>
            </Card>
            <Card sectioned>
              <Checkbox
                label="I agree to terms and conditions"
                checked={
                  this.state.partner === null
                    ? false
                    : partner.termsAndConditions.shopify
                }
                disabled={
                  this.state.partner === null
                    ? false
                    : partner.termsAndConditions.shopify
                }
              />
            </Card>
          </Layout.AnnotatedSection>
        </Layout>
      </Page>
    );
  }
}

export default Index;

const axios = require("axios");
const hubspot = require("@hubspot/api-client");
const cron = require("node-cron");
const hubspotService = require("../services/hubspotService");

const HUBSPOT_API_KEY = "your-hubspot-api-key";
const ORIGINAL_EMAIL_ID = "313117845";
const FOLLOWUP_EMAIL_ID = "312705699";

// exports.GetNonOpeners = async (req, res) => {
//   try {
//     const response = await axios.get(
//       `https://api.hubapi.com/email/public/v1/events?eventType=OPEN&campaignId=${ORIGINAL_EMAIL_ID}&hapikey=${HUBSPOT_API_KEY}`
//     );
//     const openedEmails = response.data.map((event) => event.recipient);

//     const contactsResponse = await axios.get(
//       `https://api.hubapi.com/contacts/v1/lists/all/contacts/all?hapikey=${HUBSPOT_API_KEY}`
//     );
//     const allContacts = contactsResponse.data.contacts.map(
//       (contact) => contact["vid"]
//     );

//     const nonOpeners = allContacts.filter(
//       (contact) => !openedEmails.includes(contact)
//     );

//     return nonOpeners;
//   } catch (error) {
//     console.error("Error fetching non-openers:", error);
//     return [];
//   }
// };

// exports.fetchCalls = async (req, res) => {
//   const accessToken = req.query.accessToken;
//   if (!accessToken) {
//     return res.status(400).json({ error: "Access token is required" });
//   }
//   try {
//     const response = await axios.get(
//       "https://api.hubapi.com/marketing-emails/v1/emails",
//       {
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//       }
//     );

//     const emailCampaigns = response.data.objects;
//     const campaignStatusPromises = emailCampaigns.map(async (campaign) => {
//       try {
//         const campaignData = await axios.get(
//           `https://api.hubapi.com/email/public/v1/campaigns/${campaign.allEmailCampaignIds}`,
//           {
//             headers: {
//               Authorization: `Bearer ${accessToken}`,
//             },
//           }
//         );
//         return campaignData.data.counters;
//       } catch (error) {
//         console.error(
//           `Error fetching campaign data for ID ${campaign.id}:`,
//           error
//         );
//         return null; // or handle the error as needed
//       }
//     });

//     const campaignStatus = await Promise.all(campaignStatusPromises);

//     // Remove any null values from campaignStatus if needed
//     const filteredCampaignStatus = campaignStatus.filter(
//       (status) => status !== null
//     );

//     res.json({ emailCampaigns, campaignStatus: filteredCampaignStatus });
//   } catch (error) {
//     console.error("Error fetching email campaigns:", error);
//     res.status(500).json({ error: "Error fetching email campaigns" });
//   }
// };

exports.fetchCalls = async (req, res) => {
  const accessToken = req.query.accessToken;
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }

  try {
    // Initialize the HubSpot client
    const hubspotClient = new hubspot.Client({ accessToken });

    // Define parameters for fetching calls
    const limit = 10;
    const after = undefined;
    const properties = undefined;
    const propertiesWithHistory = undefined;
    const associations = undefined;
    const archived = false;

    // Fetch calls using the Calls API
    const apiResponse = await hubspotClient.crm.objects.calls.basicApi.getPage(
      limit,
      after,
      properties,
      propertiesWithHistory,
      associations,
      archived
    );

    // Return the fetched call data
    return res.json(apiResponse);
  } catch (error) {
    console.error("Error fetching calls from HubSpot:", error);
    return res.status(500).json({ error: "Error fetching calls from HubSpot" });
  }
};
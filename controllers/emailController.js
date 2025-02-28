const cron = require("node-cron");
const hubspotService = require("../services/hubspotService");
const hubspot = require('@hubspot/api-client');
const HUBSPOT_API_KEY = "your-hubspot-api-key";
const ORIGINAL_EMAIL_ID = "313117845";
const FOLLOWUP_EMAIL_ID = "312705699";
const axios = require('axios');
const FormData = require('form-data');    
const fs = require('fs');
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

exports.GetContacts = async (req, res) => {
  const accessToken = req.query.accessToken;
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }
  try {
    const response = await axios.get(
      "https://api.hubapi.com/contacts/v1/lists/all/contacts/all",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    // console.log(JSON.stringify(response.data, null, 2));
    const contacts = response.data.contacts.map((contact) => {
      const identities = contact["identity-profiles"]?.[0]?.identities || [];
      const emailIdentity = identities.find(
        (identity) => identity.type === "EMAIL"
      );
      const email = emailIdentity ? emailIdentity.value : "";
      // console.log(identities);

      return {
        id: contact.vid,
        firstName: contact.properties.firstname?.value || "",
        lastName: contact.properties.lastname?.value || "",
        company: contact.properties.company?.value || "",
        email: email,
      };
    });
    res.json({ contacts });
  } catch (error) {
    res.send("Error fetching contacts");
  }
};

exports.GetNonOpeners = async (req, res) => {
  const accessToken = req.query.accessToken;
  const campaignId = req.query.campaignId;
  let offset = 0;
  const limit = 100;
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }
  if (!campaignId) {
    return res.status(400).json({ error: "CampaignID is required" });
  }
  try {
    const response = await axios.get(
      "https://api.hubapi.com/email/public/v1/events",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          eventType: "OPEN",
          emailCampaignId: campaignId,
          limit: limit,
        },
      }
    );

    console.log("00000000000000000000000000", response.data);

    const openedEmails = response.data.events.map((event) => event.recipient);
    console.log("1111111111111111111111111111111111111111111", openedEmails);

    const contactsResponse = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/contacts`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // const allContacts = contactsResponse.data.results.map(
    //   (contact) => contact.id
    // );
    const allContacts = contactsResponse.data.results.map(
      (contact) => contact.properties.email
    );
    // const allContacts = contactsResponse.data.contacts.map(contact => contact);
    console.log("2222222222222222222222222222222", allContacts);

    // const nonOpeners = allContacts.filter(
    //   (email) => !openedEmails.includes(email)
    // );
    const nonOpeners = allContacts.filter(
      (email) => !openedEmails.includes(email)
    );
    console.log("333333333333333333333333333333333333", nonOpeners);

    // res.json(nonOpeners);
    res.json(nonOpeners);
  } catch (error) {
    res.status(500).json({ error: "Error fetching non-openers" });
    return [];
  }
};

exports.fetchEmailCampaigns = async (req, res) => {
  const accessToken = req.query.accessToken;
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }
  try {
    const response = await axios.get(
      "https://api.hubapi.com/marketing-emails/v1/emails",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const emailCampaigns = response.data.objects;
    const campaignStatusPromises = emailCampaigns.map(async (campaign) => {
      try {
        const campaignData = await axios.get(
          `https://api.hubapi.com/email/public/v1/campaigns/${campaign.allEmailCampaignIds}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        return campaignData.data.counters;
      } catch (error) {
        console.error(
          `Error fetching campaign data for ID ${campaign.id}:`,
          error
        );
        return null; // or handle the error as needed
      }
    });

    const campaignStatus = await Promise.all(campaignStatusPromises);

    // Remove any null values from campaignStatus if needed
    const filteredCampaignStatus = campaignStatus.filter(
      (status) => status !== null
    );

    res.json({ emailCampaigns, campaignStatus: filteredCampaignStatus });
  } catch (error) {
    console.error("Error fetching email campaigns:", error);
    res.status(500).json({ error: "Error fetching email campaigns" });
  }
};

exports.GetCampaigns = async (req, res) => {
  const accessToken = req.query.accessToken;
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }
  try {
    const response = await axios.get(
      "https://api.hubapi.com/email/public/v1/campaigns/by-id?limit=10",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const campaigns = response.data.campaigns;
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: "Error fetching emailcampaigns" });
  }
};
exports.sendFollowUpEmail = async (req, res) => {
  const { subjectline, delaytime } = req.body;
  console.log("sendsendsendsendsendsend", subjectline, delaytime);
  try {
    await axios.post(
      `https://api.hubapi.com/email/public/v1/singleEmail/send`,
      {
        emailId: FOLLOWUP_EMAIL_ID,
        recipient: 32244616994,
      },
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
        },
      }
    );
  } catch (error) {
    console.error("Error sending follow-up email:", error);
  }
  // -------------------------------------------------------------------
  // try {
  //   await axios.post(
  //     `https://api.hubapi.com/email/public/v1/singleEmail/send`,
  //     {
  //       emailId: FOLLOWUP_EMAIL_ID,
  //       recipient: 32244616994,
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
  //       },
  //     }
  //   );
  // } catch (error) {
  //   console.error("Error sending follow-up email:", error);
  // }
  res.json(subjectline);
};


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
    const after = req.query.after;
    const properties = [
      "hs_call_recording_url",
      "hs_call_body"
    ];
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

exports.transcribe = async (req, res) => {
  const url = "https://api2.charla.pro/api/v1/chats/";
  const { filePath, settings } = req.body;  
  // Set up the authorization headers
  const headers = {
    'Authorization': 'Bearer eyJhY2Nlc3MtdG9rZW4iOiJIZ0xmaXFfUWQ3ZXNNWDJSaDItU3RnIiwidG9rZW4tdHlwZSI6IkJlYXJlciIsImNsaWVudCI6ImpodEVmeU92SGRnVWxmSXRKaHhFOFEiLCJleHBpcnkiOiI0ODk1MTA4NDk3IiwidWlkIjoibWFjYXJpb2ZlbGl4ZGVAZ21haWwuY29tIn0=',
    // 'Content-Type': 'multipart/form-data;charset=utf-8'    
  };

  // Set transcription options based on the provided settings
  const diarize_str = settings.diarization ? "true" : "false";
  const check_speech_str = settings.check_speech ? "true" : "false";
  const orig_language = settings.language || "en";  // Default language is English

  console.log("Starting transcription...");

  // Open the audio file for upload
  // const fileStream = fs.createReadStream("1.mp4");

  // const files = {
  //   "chat[diarize]": (null, diarize_str),
  //   "chat[source]": (null, "api"),
  //   "chat[audio_file_ext]": ("1.mp4", fileStream, "application/octet-stream"),
  // };

  // const filePath = path.join(__dirname, '1.mp4'); // Assuming the script and file are in the same directory  
  const fileData = fs.readFileSync("1.mp4");  

  const formData = new FormData();  
  formData.append("chat[diarize]", "true");  
  formData.append("chat[source]", "api");  
  formData.append("chat[audio_file_ext]", fileData, '1.mp4');  
  // formData.append("chat[audio_file]", fs.createReadStream("1.mp4"));
  try {
    // Send the audio file and settings to the Charla API
    const response = await axios.post(url, formData, {
      headers: {
        ...headers, 
   
      }
    });

    const responseData = response.data;
    const chat_id = responseData?.chat?.data?.id;
    if (!chat_id) {
      throw new Error("Charla API did not return a valid chat ID.");
    }

    console.log(`✅ File uploaded successfully. Chat ID: ${chat_id}`);

    // Poll the Charla API to check when transcription is completed
    for (let attempt = 0; attempt < 30; attempt++) {  // Retry up to 30 times (5 min approx)
      const pollResponse = await axios.get(`https://api2.charla.pro/api/v1/chats/${chat_id}`, { headers });

      if (pollResponse.status !== 200) {
        console.error(`⚠️ Polling error: ${pollResponse.statusText}`);
        break;  // Exit loop if polling fails
      }

      const pollData = pollResponse.data;
      const transcribeStatus = pollData?.data?.attributes?.transcribe_status || 'pending';
      const transcribedTextStr = pollData?.data?.attributes?.transcribed_text;

      // Check if transcription is complete
      if (transcribeStatus === "completed" && transcribedTextStr) {
        const transcribedText = JSON.parse(transcribedTextStr);
        const transcriptionResult = transcribedText?.segments || "No transcription found";

        // Extract additional data
        const audioUrl = pollData?.data?.attributes?.audio_url;
        const textUrl = pollData?.data?.attributes?.text_url;
        const summaryUrl = pollData?.data?.attributes?.summary_url;
        const srtFileUrl = pollData?.data?.attributes?.srt_file_url;
        const translationUrl = pollData?.data?.attributes?.translation_url;

        console.log("✅ Transcription is ready!");
        return res.status(200).json({  
          success: true,  
          chat_id,  
          transcription: transcriptionResult,  
          language: transcribedText.language,  
          audio_url: audioUrl,  
          text_url: textUrl,  
          summary_url: summaryUrl,  
          srt_file_url: srtFileUrl,  
          translation_url: translationUrl  
        });  
      }

      // Wait for 10 seconds before polling again
      console.log(`⏳ Transcription status: ${transcribeStatus}... Retrying in 10 seconds.`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // If transcription was not completed after all attempts
    throw new Error("Transcription timed out.");

  } catch (error) {
    console.error("Error during transcription:", error);
    throw new Error("Error during transcription process.");
  }
};



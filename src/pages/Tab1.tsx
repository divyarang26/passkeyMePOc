import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab1.css';
import { PasskeymeSDK } from 'passkeyme-ionic-cap-plugin';
import axios from "axios";
import { useState } from 'react';
import { getPublicKeys } from "../utils/webauthnUtils";

// import * as cbor from 'cbor';

import * as cbor from 'cbor-web'; // Or 'cbor' if using a bundler and cbor

const API_URL = "https://passkeyme.com";
const APP_UUID = "cad7760b-3ee4-4df8-b7b4-73cdeaff0774"; 
const API_KEY = "36LP0Z0frQaYgqduOXl6fjW0llIhQNXr";

const Tab1: React.FC = () => {

  const [msg , setMsg] = useState("msgcredential")

  async function registerPasskey() {
        
    try {
        let username = "divyarang";
        let displayName = "fortesting";


      const startResponse = await axios.post(
        `${API_URL}/webauthn/${APP_UUID}/start_registration`, 
        { username, displayName },
        { headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' } }
      );
      
      
      const { credential } = await PasskeymeSDK.passkeyRegister({ challenge: startResponse.data.challenge });
      
      setMsg(JSON.parse(credential));

      console.log("🚀 ~ Tab1.tsx:34 ~ registerPasskey ~ credential:", JSON.parse(credential));
      window.localStorage.setItem("creden",credential);

      const { contractSalt, publicKey } = await getPublicKeys(JSON.parse(credential));


      console.log("🚀 ~ Tab1.tsx:45 ~ registerPasskey ~ contractSalt:", contractSalt);

      console.log("🚀 ~ PasskeyRegister.jsx:96 ~ registerPasskey ~ publicKey:", publicKey);

      const completeResponse = await axios.post(
        `${API_URL}/webauthn/${APP_UUID}/complete_registration`, 
        { username, credential },
        { headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' } }
      );

      console.log("🚀 ~ Tab1.tsx:49 ~ registerPasskey ~ completeResponse:", completeResponse);




    } catch (error) {

      console.log("🚀 ~ CardPage.tsx:84 ~ registerPasskey ~ error:", error);          
    }
  };


  async function test() {
   let data =  window.localStorage.getItem("creden")

   console.log("🚀 ~ Tab1.tsx:70 ~ test ~ data:", JSON.stringify(data));
   const { contractSalt, publicKey } = await getPublicKeys(JSON.parse(data ? data : "" ));


   console.log("🚀 ~ Tab1.tsx:74 ~ test ~ publicKey:", publicKey);


   console.log("🚀 ~ Tab1.tsx:74 ~ test ~ contractSalt:", contractSalt);


  }
  
  



  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tab 1</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tab 1</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonButton onClick={registerPasskey}>generate passkey</IonButton>
        <IonButton onClick={test}>test</IonButton>


        <IonTitle>{msg}</IonTitle>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;

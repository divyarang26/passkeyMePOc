import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab1.css';
import { PasskeymeSDK } from 'passkeyme-ionic-cap-plugin';
import axios from "axios";

const API_URL = "https://passkeyme.com";
const APP_UUID = "cad7760b-3ee4-4df8-b7b4-73cdeaff0774"; 
const API_KEY = "36LP0Z0frQaYgqduOXl6fjW0llIhQNXr";

const Tab1: React.FC = () => {

  async function registerPasskey() {
        
    try {

        let username = "divyarang";
        let displayName = "fortesting";
    console.log('Current Origin:', window.location.origin);
    console.log("divya rang")


      const startResponse = await axios.post(
        `${API_URL}/webauthn/${APP_UUID}/start_registration`, 
        { username, displayName },
        { headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' } }
      );

      console.log("🚀 ~ Tab1.tsx:29 ~ registerPasskey ~ startResponse: 3333", startResponse);




      const { credential } = await PasskeymeSDK.passkeyRegister({ challenge: startResponse.data.challenge });


      console.log("🚀 ~ Tab1.tsx:34 ~ registerPasskey ~ credential:", credential);


      const completeResponse = await axios.post(
        `${API_URL}/webauthn/${APP_UUID}/complete_registration`, 
        { username, credential },
        { headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' } }
      );



    } catch (error) {

      console.log("🚀 ~ CardPage.tsx:84 ~ registerPasskey ~ error:", error);          
    }
  };




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
      </IonContent>
    </IonPage>
  );
};

export default Tab1;

export { auth, db } from '@/lib/firebase'

import firebaseConfig from '../../../firebase-applet-config.json'

/** True when a real Firebase project is configured (not dummy local placeholders). */
export const isFirebaseAvailable = Boolean(firebaseConfig?.apiKey && !String(firebaseConfig.apiKey).includes('dummy'))

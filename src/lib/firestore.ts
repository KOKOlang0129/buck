import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { Scenario, UserProfile } from '@/types'

// Scenarios Collection
export const scenariosCollection = collection(db, 'scenarios')

export const createScenario = async (scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(scenariosCollection, {
      ...scenario,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating scenario:', error)
    throw error
  }
}

export const updateScenario = async (id: string, updates: Partial<Scenario>) => {
  try {
    const scenarioRef = doc(db, 'scenarios', id)
    await updateDoc(scenarioRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating scenario:', error)
    throw error
  }
}

export const deleteScenario = async (id: string) => {
  try {
    const scenarioRef = doc(db, 'scenarios', id)
    await deleteDoc(scenarioRef)
  } catch (error) {
    console.error('Error deleting scenario:', error)
    throw error
  }
}

export const getScenario = async (id: string): Promise<Scenario | null> => {
  try {
    const scenarioRef = doc(db, 'scenarios', id)
    const scenarioSnap = await getDoc(scenarioRef)
    
    if (scenarioSnap.exists()) {
      const data = scenarioSnap.data()
      return {
        id: scenarioSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Scenario
    }
    return null
  } catch (error) {
    console.error('Error getting scenario:', error)
    throw error
  }
}

export const getUserScenarios = async (userId: string): Promise<Scenario[]> => {
  try {
    const q = query(
      scenariosCollection,
      where('authorId', '==', userId),
      orderBy('updatedAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Scenario
    })
  } catch (error) {
    console.error('Error getting user scenarios:', error)
    throw error
  }
}

export const getPublicScenarios = async (limitCount: number = 10): Promise<Scenario[]> => {
  try {
    const q = query(
      scenariosCollection,
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Scenario
    })
  } catch (error) {
    console.error('Error getting public scenarios:', error)
    throw error
  }
}

// Users Collection
export const usersCollection = collection(db, 'users')

export const createUserProfile = async (userProfile: UserProfile) => {
  try {
    const userRef = doc(db, 'users', userProfile.id)
    await updateDoc(userRef, {
      ...userProfile,
      createdAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      const data = userSnap.data()
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as UserProfile
    }
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

// Allowed Users Collection (for admin approval)
export const allowedUsersCollection = collection(db, 'allowed_users')

export const addAllowedUser = async (userId: string) => {
  try {
    const allowedUserRef = doc(db, 'allowed_users', userId)
    await updateDoc(allowedUserRef, {
      userId,
      allowedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error adding allowed user:', error)
    throw error
  }
}

export const removeAllowedUser = async (userId: string) => {
  try {
    const allowedUserRef = doc(db, 'allowed_users', userId)
    await deleteDoc(allowedUserRef)
  } catch (error) {
    console.error('Error removing allowed user:', error)
    throw error
  }
}

export const isUserAllowed = async (userId: string): Promise<boolean> => {
  try {
    const allowedUserRef = doc(db, 'allowed_users', userId)
    const allowedUserSnap = await getDoc(allowedUserRef)
    return allowedUserSnap.exists()
  } catch (error) {
    console.error('Error checking if user is allowed:', error)
    return false
  }
}

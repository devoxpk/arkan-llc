
import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export async function GET() {
  try {
    const aboutDocRef = doc(db, 'about', 'main');
    const aboutSnapshot = await getDoc(aboutDocRef);
    if (!aboutSnapshot.exists()) {
      console.log('About document does not exist. Initializing with default data.');
      await setDoc(aboutDocRef, { header: '', paragraph: '' });
    }
    const aboutData = aboutSnapshot.exists() ? aboutSnapshot.data() : { header: '', paragraph: '' };
    return NextResponse.json(aboutData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/aboutEdit:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: {
      'Access-Control-Allow-Origin': '*',
    } });
  }
}

export async function POST(request) {
  if (request.method === 'OPTIONS') {
    return NextResponse.json({ message: 'CORS preflight' }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  try {
    const { header, paragraph } = await request.json();
    const updatedAboutData = { header, paragraph };
    const aboutDocRef = doc(db, 'about', 'main');
    await updateDoc(aboutDocRef, updatedAboutData);
    console.log('Updated data:', updatedAboutData);
    return NextResponse.json({ message: 'Update successful', data: updatedAboutData }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error in POST /api/aboutEdit:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500, headers: {
      'Access-Control-Allow-Origin': '*',
    } });
  }
} 
import { NextResponse } from 'next/server';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const servicesCollection = collection(db, 'services');

export async function GET() {
  try {
    const servicesSnapshot = await getDocs(servicesCollection);
    const services = servicesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(services, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error in GET:', error);
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
    const newService = await request.json();
    const addedDoc = await addDoc(servicesCollection, newService);
    newService.id = addedDoc.id;
    return NextResponse.json(newService, { status: 201, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    } });
  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500, headers: {
      'Access-Control-Allow-Origin': '*',
    } });
  }
}

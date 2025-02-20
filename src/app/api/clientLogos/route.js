import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

async function fetchClientLogos() {
  const logosSnapshot = await getDocs(collection(db, 'clientLogos'));
  return logosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function GET() {
  const logos = await fetchClientLogos();
  return NextResponse.json(logos, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
import { NextResponse } from 'next/server';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const updatedService = await request.json();
    const serviceDocRef = doc(db, 'services', id);
    await updateDoc(serviceDocRef, {
      title: updatedService.title,
      text: updatedService.text,
      image: updatedService.image,
      reverse: updatedService.reverse,
    });

    return NextResponse.json({ message: 'Service updated successfully' }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in PUT:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500, headers: {
      'Access-Control-Allow-Origin': '*',
    } });
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    const serviceDocRef = doc(db, 'services', id);
    await deleteDoc(serviceDocRef);

    return NextResponse.json({ message: 'Service deleted successfully' }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in DELETE:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500, headers: {
      'Access-Control-Allow-Origin': '*',
    } });
  }
} 
import { NextResponse } from 'next/server';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export async function GET() {
  console.log('GET request received at /api/weBelieve');
  try {
    const weBelieveDocRef = doc(db, 'weBelieve', 'main');
    const weBelieveSnapshot = await getDoc(weBelieveDocRef);
    if (!weBelieveSnapshot.exists()) {
      console.log('weBelieve document does not exist. Initializing with default data.');
      await setDoc(weBelieveDocRef, { header: '', text: '', team: [] });
    }
    const data = weBelieveSnapshot.exists() ? weBelieveSnapshot.data() : { header: '', text: '', team: [] };
    console.log('GET request successful. Returning data:', data);
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/weBelieve:', error);
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
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  console.log('POST request received at /api/weBelieve');
  try {
    const { header, text, name, position, image } = await request.json();
    console.log('POST data:', { header, text, name, position, image });

    const weBelieveDocRef = doc(db, 'weBelieve', 'main');
    const weBelieveSnapshot = await getDoc(weBelieveDocRef);
    const data = weBelieveSnapshot.exists() ? weBelieveSnapshot.data() : { header: '', text: '', team: [] };

    if (header || text) {
      // Update header and text
      const updatedData = {
        header: header || data.header,
        text: text || data.text,
      };
      await updateDoc(weBelieveDocRef, updatedData);
      console.log('Header and text updated successfully.');
      return NextResponse.json({ message: 'Text updated' }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (name && position && image) {
      // Add new person with base64 image
      const newPerson = { id: Date.now().toString(), name, position, image };
      const updatedTeam = [...data.team, newPerson];
      await updateDoc(weBelieveDocRef, { team: updatedTeam });
      console.log('New person added:', newPerson);
      return NextResponse.json({ message: 'Person added', team: updatedTeam }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    console.warn('POST /api/weBelieve received invalid data.');
    return NextResponse.json({ error: 'Invalid data' }, { status: 400, headers: {
      'Access-Control-Allow-Origin': '*',
    } });
  } catch (error) {
    console.error('Error in POST /api/weBelieve:', error);
    return NextResponse.json({ error: 'Failed to add/update data' }, { status: 500, headers: {
      'Access-Control-Allow-Origin': '*',
    } });
  }
}

export async function DELETE(request) {
  if (request.method === 'OPTIONS') {
    return NextResponse.json({ message: 'CORS preflight' }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  console.log('DELETE request received at /api/weBelieve');
  try {
    const { id } = await request.json();
    console.log('DELETE request for ID:', id);

    if (!id) {
      console.warn('DELETE /api/weBelieve received without ID.');
      return NextResponse.json({ error: 'ID is required' }, { status: 400, headers: {
        'Access-Control-Allow-Origin': '*',
      } });
    }

    const weBelieveDocRef = doc(db, 'weBelieve', 'main');
    const weBelieveSnapshot = await getDoc(weBelieveDocRef);
    if (!weBelieveSnapshot.exists()) {
      console.warn(`weBelieve document does not exist.`);
      return NextResponse.json({ error: 'Person not found' }, { status: 404, headers: {
        'Access-Control-Allow-Origin': '*',
      } });
    }

    const data = weBelieveSnapshot.data();
    const teamIndex = data.team.findIndex(person => person.id === id);

    if (teamIndex === -1) {
      console.warn(`Person with ID ${id} not found.`);
      return NextResponse.json({ error: 'Person not found' }, { status: 404, headers: {
        'Access-Control-Allow-Origin': '*',
      } });
    }

    data.team.splice(teamIndex, 1);
    await updateDoc(weBelieveDocRef, { team: data.team });
    console.log(`Person with ID ${id} deleted successfully.`);
    return NextResponse.json({ message: 'Person deleted', team: data.team }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error in DELETE /api/weBelieve:', error);
    return NextResponse.json({ error: 'Failed to delete person' }, { status: 500, headers: {
      'Access-Control-Allow-Origin': '*',
    } });
  }
}
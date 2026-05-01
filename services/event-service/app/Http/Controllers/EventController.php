<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;



class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with(['venue', 'organizer', 'tickets']);

        // filtering
        if ($request->has('name')) {
            $query->where('name', 'like', '%' . $request->name . '%');
        }

        // pagination untuk ketentuan per/page
        $events = $query->paginate($request->per_page ?? 5);

        return response()->json($events);
    }

    public function show($id){

        $event = Event::with(['venue', 'organizer', 'tickets'])->find($id);

        if (!$event) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($event);
    }

    public function store(Request $request)
{
    $request->validate([
        'name' => 'required|string',
        'date' => 'required|date',
        'venue_id' => 'required|integer',
        'organizer_id' => 'required|integer'
    ]);

    $event = Event::create($request->all());

    return response()->json($event, 201);
}
}

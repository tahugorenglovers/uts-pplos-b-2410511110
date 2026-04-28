<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'name',
        'date',
        'venue_id',
        'organizer_id'
    ];

    public function venue(){
        return $this->belongsTo(Venue::class);
    }

    public function organizer(){
        return $this->belongsTo(Organizer::class);
    }

    public function tickets(){
        return $this->hasMany(TicketCategory::class);
    }
}

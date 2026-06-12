# ROAD-SNAPPED BUS TRACKING SYSTEM REBUILD

## Mission

Transform the current U-BOCC map from a "floating bus marker simulation" into a realistic transit vehicle tracking system similar to Uber, Ola, Rapido, Moovit, and AVL fleet monitoring platforms.

The current implementation is NOT acceptable.

Current problems:

- buses scattered randomly
- buses not following roads
- buses rotate incorrectly
- buses move unnaturally
- routes are not respected
- no realistic turning
- no depot-based dispatching
- no stop-to-stop behavior

The objective is to completely replace the vehicle movement engine.

------------------------------------------------------------------------

# PHASE 1

## Route Ownership

Every bus must belong to a route.

Example:

Route 21G: Broadway → Tambaram

Route 57: Broadway → CMBT

Route 29C: Perambur → Besant Nagar

Bus object:

    {
      "bus_id":"MTC-21G-001",
      "route_no":"21G",
      "depot":"Broadway",
      "current_stop":"Egmore",
      "next_stop":"Central",
      "occupancy":65
    }

No bus should exist without a route.

------------------------------------------------------------------------

# PHASE 2

## Route Geometry Generation

DO NOT create straight lines.

Use:

- OpenStreetMap road network
- Valhalla
- OSRM
- Mapbox Directions API

Generate:

    Stop A
    ↓
    Road Network
    ↓
    Turn By Turn Geometry
    ↓
    Polyline

Store as:

    {
      "route_no":"21G",
      "geometry":[
        [80.2701,13.0827],
        [80.2703,13.0828],
        [80.2705,13.0829]
      ]
    }

Every bus must move only on geometry points.

Never move directly between stops.

------------------------------------------------------------------------

# PHASE 3

## Road Snapping

Every coordinate must be snapped to roads.

Invalid:

Bus moving through:

- buildings
- lakes
- parks

Valid:

Bus moves only on roads.

------------------------------------------------------------------------

# PHASE 4

## Vehicle Animation Engine

Replace current movement logic.

Current:

Random marker movement.

New:

Route Geometry ↓ Interpolation Engine ↓ requestAnimationFrame ↓ Smooth Vehicle Tracking

Movement:

- smooth
- continuous
- no jumps

------------------------------------------------------------------------

# PHASE 5

## Left Turn / Right Turn Logic {#left-turn-right-turn-logic}

Current problem:

Vehicle instantly changes direction.

Required:

Vehicle rotates gradually.

Calculate:

Heading:

    heading = atan2(
     nextLat-currentLat,
     nextLng-currentLng
    )

Then interpolate:

    currentHeading +=
    (targetHeading-currentHeading)*0.1

Result:

- smooth left turn
- smooth right turn
- realistic rotation

------------------------------------------------------------------------

# PHASE 6

## Stop Behavior

Every stop must have dwell time.

Example:

Minor Stop: 5 sec

Major Stop: 15 sec

Terminus: 30 sec

Bus must:

Approaching Stop ↓ Slow Down ↓ Stop ↓ Wait ↓ Resume

------------------------------------------------------------------------

# PHASE 7

## Depot Dispatching

Current system:

All buses already on map.

Wrong.

Correct:

Depot ↓ Dispatch Bus ↓ Bus Appears ↓ Joins Route

Depots:

- Broadway
- Tambaram
- Adyar
- Perambur
- Avadi
- CMBT

------------------------------------------------------------------------

# PHASE 8

## Headway Management

Avoid bus bunching.

Route 21G:

Desired frequency: 5 minutes

If two buses become too close:

- slow trailing bus OR

- increase spacing

Maintain even distribution.

------------------------------------------------------------------------

# PHASE 9

## Traffic Simulation

Traffic zones:

Green: 35 km/h

Orange: 20 km/h

Red: 10 km/h

Bus speed changes dynamically.

ETA recalculates.

------------------------------------------------------------------------

# PHASE 10

## Visual Requirements

Each bus marker must display:

- route number
- service type
- occupancy status

Example:

\[21G\] \[AC\] \[65%\]

Click Bus:

Show:

- route
- current stop
- next stop
- ETA
- occupancy
- depot

------------------------------------------------------------------------

# PHASE 11

## Optimization Impact

Current approval flow has no visual effect.

Fix:

Before Approval:

- 8 buses
- 18 min wait

After Approval:

- 15 buses
- 6 min wait

Visible changes:

- more buses dispatched
- route density increases
- ETA decreases
- heatmap cools

------------------------------------------------------------------------

# PHASE 12

## Final Validation

Project is complete ONLY IF:

✓ buses stay on roads

✓ buses follow route geometry

✓ buses turn naturally

✓ buses stop at stops

✓ buses belong to routes

✓ buses dispatch from depots

✓ frequency optimization visibly changes operations

✓ movement resembles Uber / Ola style tracking

NOT floating markers.

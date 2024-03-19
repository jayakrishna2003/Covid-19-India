const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'covid19India.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertstateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`
  const statesArray = await database.all(getStatesQuery)
  response.send(statesArray)
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getstateQuery = `
    SELECT 
      *
    FROM 
      state 
    WHERE 
      state_id = ${stateId};`
  // const state = await database.get(getstateQuery)
  // response.send(convertstateDbObjectToResponseObject(state))
  // const state = await db.get(getstateQuery)
  // response.send(state)
  try {
    const state = await database.get(getstateQuery)
    if (state) {
      response.send(state)
    } else {
      response.status(404).send('State not found')
    }
  } catch (error) {
    response.status(500).send(error.message)
  }
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postdistrictQuery = `
  INSERT INTO
    district ( district_name,state_id,cases,cured,active,deaths)
  VALUES
    ('${districtName}',${stateId} ,'${cases}','${cured}','${active}','${deaths}');`
  try {
    await database.run(postdistrictQuery)
    response.send('District Successfully Added')
  } catch (error) {
    response.status(500).send(error.message)
  }
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getdistrictQuery = `
    SELECT
      *
    FROM
      district
    WHERE
      district_id = ${districtId};`
  try {
    const district = await database.get(getdistrictQuery)
    if (district) {
      response.send(district)
    } else {
      response.status(404).send('District not found')
    }
  } catch (error) {
    response.status(500).send(error.message)
  }
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deletedistrictQuery = `
    DELETE FROM
      district
    WHERE
      district_id = ${districtId};`
  try {
    await database.run(deletedistrictQuery)
    response.send('District Removed')
  } catch (error) {
    response.status(500).send(error.message)
  }
})

// app.put('/districts/:districtId/', async (request, response) => {
//   const {districtId} = request.params
//   const {districtName, stateId, cases, cured, active, deaths} = request.body
//   const updatedistrictQuery = `
//     UPDATE
//       district
//     SET
//       '${districtName}',${stateId} ,'${cases}','${cured}','${active}','${deaths}'
//     WHERE
//       district_id = ${districtId};`
//   try {
//     await database.run(updatedistrictQuery)
//     response.send('District Details Updated')
//   } catch (error) {
//     response.status(500).send(error.message)
//   }
// })
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updatedistrictQuery = `
    UPDATE
      district
    SET
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = '${cases}',
      cured = '${cured}',
      active = '${active}',
      deaths = '${deaths}'
    WHERE
      district_id = ${districtId};`
  try {
    await database.run(updatedistrictQuery)
    response.send('District Details Updated')
  } catch (error) {
    response.status(500).send(error.message)
  }
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatsQuery = `
    SELECT
      SUM(cases) AS totalCases,
      SUM(cured) AS totalCured,
      SUM(active) AS totalActive,
      SUM(deaths) AS totalDeaths
    FROM
      district
    WHERE
      state_id = ${stateId};`

  try {
    const stats = await database.get(getStatsQuery)
    if (stats) {
      response.json({
        totalCases: stats.totalCases,
        totalCured: stats.totalCured,
        totalActive: stats.totalActive,
        totalDeaths: stats.totalDeaths,
      })
    } else {
      response.status(404).send('Statistics not found')
    }
  } catch (error) {
    response.status(500).send(error.message)
  }
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
    SELECT
      s.state_name AS stateName
    FROM
      state s
    INNER JOIN
      district d ON s.state_id = d.state_id
    WHERE
      d.district_id = ${districtId};`

  try {
    const stateDetails = await database.get(getStateNameQuery)
    if (stateDetails) {
      response.json({
        stateName: stateDetails.stateName,
      })
    } else {
      response.status(404).send('State name not found')
    }
  } catch (error) {
    response.status(500).send(error.message)
  }
})

module.exports = app

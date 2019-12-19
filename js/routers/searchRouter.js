const searchDb = require('../database/searchDb')
const router = require('express').Router()
const {BAD_REQUEST} = require('../Messages')
const { catchErrors } = require('../helpers')

/**
 * 
 * @param {*} req : body: {
 * 
 *              search: {
 *                      searchString='', organizations=[], countries=[],
cities=[], categories=[], tags=[], speakers=[],  dates={},price={},CECredits={}
 * 
 *                  }
 * }
 */
async function search(req, res){
    const {
        search:{
            searchString='',
            organizations=false,
            countries=false,
            cities=false,
            categories=false,
            tags=false,
            speakers=false,
            dates=false,
            price=false,
            CECredits=false
        }
    } = req.body

    let data = {
        searchString,
        organizations,
        countries,
        cities,
        categories,
        tags,
        speakers,
        dates,
        price,
        CECredits
    }

    let events = await searchDb.search(data)
    if(events){ res.status(200).json({success: true, events})}
    else { res.status(404).json(BAD_REQUEST("Could not process the request"))}
}

router.post('/searchEvents', catchErrors(search))

module.exports = router
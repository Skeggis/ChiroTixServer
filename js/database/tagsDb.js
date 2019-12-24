require('dotenv').config();
const db = require('./db');
const formatter = require('../formatter')
const {SYSTEM_ERROR} = require('../Messages')

const {
    TAGS_DB
} = process.env;

/**
 * 
 * @param {String} tag 
 */
async function insertTag(tag){
    let query = `insert into ${TAGS_DB} (tag) values('${tag}') returning *`
    let result = await db.query(query)
    let theTag = await formatter.formatTag(result.rows[0])
    return theTag
}

/**
 * 
 * @param {Array} tags : [String]
 */
async function insertTags(tags){
    let query = `insert into ${TAGS_DB} (tag) values`
    for(let i = 0; i < tags.length; i++){
        query += ` ('${tags[i]}')`
        if(i < tags.length-1){query+=","}
    }

    query += " returning *"
    let result = await db.query(query)
    let theTags = await formatter.formatTags(result.rows)
    return theTags
}

/**
 * 
 * @param {Integer} tagId 
 */
async function deleteTag(tagId){
    let query = `delete from ${TAGS_DB} where id=${tagId}`
    await db.query(query)
    return true
}

/**
 * 
 * @param {Array} tagIds : [Integer]
 */
async function deleteTags(tagIds){
    let query = `delete from ${TAGS_DB} where id=Any('{${tagIds.toString()}}')`
    await db.query(query)
    return true
}

/**
 * 
 * @param {Array} tagIds : [Integer]
 */
async function getTags(tagIds){
    let query = `select * from ${TAGS_DB} where id=Any('{${tagIds.toString()}}')`
    let result = await db.query(query)
    let tags = await formatter.formatTags(result.rows)
    return tags
}

async function getAllTags(){
    let query = `select * from ${TAGS_DB}`
    let result = await db.query(query)
    let tags = await formatter.formatTags(result.rows)
    return tags
}

module.exports = {insertTag, insertTags, deleteTag, deleteTags, getAllTags, getTags}
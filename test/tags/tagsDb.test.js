require('dotenv').config()
const tagsDB = require('../../js/database/tagsDb')
const expect = require('chai').expect;

describe('TagsDb test', async () => {
    let tagName = "Fyrsta taggið"
    let tagNames = ["Fleiri tögg", "Bró", "Skjaldbaka"]
    let tagIds;
    let tagId;

    it('should insert a single tag', async () => {
        let tag = await tagsDB.insertTag(tagName)
        expect(tag.tag).to.equal(tagName)
        tagId = tag.id
    })

    it('should insert multiple tags and get them', async () => {
        let tags = await tagsDB.insertTags(tagNames)
        expect(tags.length).to.equal(tagNames.length)

        tagIds = []
        for(let i = 0; i < tags.length; i++){ tagIds.push(tags[i].id) }
        let theTags = await tagsDB.getTags(tagIds)
        expect(theTags.length).to.equal(tags.length)
    })

    it('should delete a single tag and get all tags', async () => {
        let success = await tagsDB.deleteTag(tagId)
        expect(success).to.be.true

        let tags = await tagsDB.getAllTags()
        for(let i = 0; i<tags.length; i++){
            expect(tags[i].id===tagId).to.be.false
        }
    })

    it('should delete multiple tags', async () => {
        let success = await tagsDB.deleteTags(tagIds)
        expect(success).to.be.true

        let tags = await tagsDB.getAllTags()
        expect(tags.length).to.equal(0)
    })
})
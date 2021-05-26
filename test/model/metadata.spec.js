const should = require('should/as-function')
const Metadata = require('../../src/model/metadata')
var fixtures = require('../fixtures')

describe('Metadata', function () {
  describe('date taken', function () {
    it('reads the EXIF date if present', function () {
      const exiftool = fixtures.exiftool()
      exiftool.EXIF.DateTimeOriginal = '2016:10:28 17:34:58' // EXIF date format
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2016-10-28 17:34:58').getTime())
    })

    it('reads the H264 date if present', function () {
      const exiftool = fixtures.exiftool()
      exiftool.H264.DateTimeOriginal = '2016:10:28 17:34:58' // EXIF date format
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2016-10-28 17:34:58').getTime())
    })

    it('reads the QuickTime CreationDate if present', function () {
      const exiftool = fixtures.exiftool()
      exiftool.QuickTime.CreationDate = '2016:10:28 17:34:58' // EXIF date format
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2016-10-28 17:34:58').getTime())
    })

    it('reads the QuickTime CreateDate if present', function () {
      const exiftool = fixtures.exiftool()
      exiftool.QuickTime.CreateDate = '2016:10:28 17:34:58' // EXIF date format
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2016-10-28 17:34:58').getTime())
    })

    it('prefers the ContentCreateDate field if present', function () {
      // when exporting a movie from the macOS Photos app, it sets
      // CreateDate=date_of_export and ContentCreateDate=date_taken
      const exiftool = fixtures.exiftool()
      exiftool.QuickTime.CreateDate = '2016:10:28 17:34:58' // EXIF date format
      exiftool.QuickTime.ContentCreateDate = '2016:09:02 10:25:41' // EXIF date format
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2016-09-02 10:25:41').getTime())
    })

    it('infers the date from the filename (Android format)', function () {
      const exiftool = fixtures.exiftool()
      exiftool.SourceFile = 'folder/VID_20170220_114006.mp4'
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2017-02-20 11:40:06').getTime())
    })

    it('infers the date from the filename (Dropbox format)', function () {
      const exiftool = fixtures.exiftool()
      exiftool.SourceFile = 'folder/2017-03-24 19.42.30.jpg'
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2017-03-24 19:42:30').getTime())
    })

    it('only infers dates from valid formats', function () {
      const exiftool = fixtures.exiftool()
      exiftool.SourceFile = 'folder/IMG_1234.jpg'
      exiftool.File.FileModifyDate = '2016:10:28 17:34:58'
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2016-10-28 17:34:58').getTime())
    })

    it('does not look at the file name if it already has EXIF data', function () {
      const exiftool = fixtures.exiftool()
      exiftool.SourceFile = '2017-03-24 19.42.30.jpg'
      exiftool.EXIF.DateTimeOriginal = '2016:10:28 17:34:58'
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2016-10-28 17:34:58').getTime())
    })

    it('defaults to the file date if there is no other date', function () {
      const exiftool = fixtures.exiftool()
      exiftool.File.FileModifyDate = '2016:10:28 17:34:58'
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2016-10-28 17:34:58').getTime())
    })

    it('ignores the EXIF date if invalid', function () {
      const exiftool = fixtures.exiftool()
      exiftool.EXIF.DateTimeOriginal = '0000:00:00 00:00:00'
      exiftool.File.FileModifyDate = '2016:10:28 17:34:58'
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2016-10-28 17:34:58').getTime())
    })

    it('ignores the filename if not a valid date', function () {
      const exiftool = fixtures.exiftool()
      exiftool.SourceFile = '0000-00-00 00.00.00.jpg'
      exiftool.File.FileModifyDate = '2016:10:28 17:34:58'
      const meta = new Metadata(exiftool)
      should(meta.date).eql(fixtures.date('2016-10-28 17:34:58').getTime())
    })
  })

  describe('photos and videos', function () {
    it('can tell if a file is a regular photo', function () {
      const exiftool = fixtures.exiftool()
      exiftool.File.MIMEType = 'image/jpeg'
      const meta = new Metadata(exiftool)
      should(meta.video).eql(false)
      should(meta.animated).eql(false)
    })

    it('can tell if a file is a non-animated gif', function () {
      const exiftool = fixtures.exiftool()
      exiftool.File.MIMEType = 'image/gif'
      const meta = new Metadata(exiftool)
      should(meta.video).eql(false)
      should(meta.animated).eql(false)
    })

    it('can tell if a file is an animated gif', function () {
      const exiftool = fixtures.exiftool()
      exiftool.File.MIMEType = 'image/gif'
      exiftool.GIF = { FrameCount: 10 }
      const meta = new Metadata(exiftool)
      should(meta.video).eql(false)
      should(meta.animated).eql(true)
    })

    it('can tell if a file is a video', function () {
      const exiftool = fixtures.exiftool()
      exiftool.File.MIMEType = 'video/mp4'
      const meta = new Metadata(exiftool)
      should(meta.video).eql(true)
      should(meta.animated).eql(false)
    })
  })

  describe('title', function () {
    it('is read from EXIF', function () {
      const exiftool = fixtures.exiftool()
      exiftool.EXIF.DocumentName = 'some document name'
      const meta = new Metadata(exiftool)
      should(meta.title).eql('some document name')
    })

    it('can be missing', function () {
      const exiftool = fixtures.exiftool()
      const meta = new Metadata(exiftool)
      should(meta.title).undefined()
    })
  })

  describe('caption', function () {
    it('is read from all standard EXIF/IPTC/XMP tags', function () {
      const tags = [
        { type: 'EXIF', tag: 'ImageDescription' },
        { type: 'IPTC', tag: 'Caption-Abstract' },
        { type: 'IPTC', tag: 'Headline' },
        { type: 'XMP', tag: 'Description' },
        { type: 'XMP', tag: 'Title' },
        { type: 'XMP', tag: 'Label' }
      ]
      tags.forEach(t => {
        const exiftool = fixtures.exiftool()
        exiftool[t.type][t.tag] = 'some caption'
        const meta = new Metadata(exiftool)
        should(meta.caption).eql('some caption')
      })
    })

    it('can be read from Picasa', function () {
      const exiftool = fixtures.exiftool()
      const picasa = { caption: 'some caption' }
      const meta = new Metadata(exiftool, picasa)
      should(meta.caption).eql('some caption')
    })
  })

  describe('keywords', function () {
    it('defaults to an empty array', function () {
      const exiftool = fixtures.exiftool()
      const meta = new Metadata(exiftool)
      should(meta.keywords).eql([])
    })

    it('can read a single IPTC keyword', function () {
      // a single keyword is returned as a string by <exiftool>
      const exiftool = fixtures.exiftool()
      exiftool.IPTC['Keywords'] = 'beach'
      const meta = new Metadata(exiftool, {})
      should(meta.keywords).eql(['beach'])
    })

    it('can read multiple IPTC keywords', function () {
      // multiple keywords are returned as an array by <exiftool>
      const exiftool = fixtures.exiftool()
      exiftool.IPTC['Keywords'] = ['beach', 'sunset']
      const meta = new Metadata(exiftool)
      should(meta.keywords).eql(['beach', 'sunset'])
    })

    it('can read a single Picasa keywords', function () {
      const exiftool = fixtures.exiftool()
      const picasa = { keywords: 'beach' }
      const meta = new Metadata(exiftool, picasa)
      should(meta.keywords).eql(['beach'])
    })

    it('can read multiple Picasa keywords', function () {
      // because it's a simple INI file, multiple keywords are comma-separated
      const exiftool = fixtures.exiftool()
      const picasa = { keywords: 'beach,sunset' }
      const meta = new Metadata(exiftool, picasa)
      should(meta.keywords).eql(['beach', 'sunset'])
    })

    it('combines all keyword sources', function () {
      const exiftool = fixtures.exiftool()
      exiftool.IPTC['Keywords'] = ['beach', 'sunset']
      exiftool.XMP['Subject'] = 'holiday'
      const picasa = { keywords: 'sandiego' }
      const meta = new Metadata(exiftool, picasa, {})
      should(meta.keywords).eql(['beach', 'sunset', 'holiday', 'sandiego'])
    })

    it('only keeps unique keywords', function () {
      const exiftool = fixtures.exiftool()
      exiftool.IPTC['Keywords'] = ['beach', 'sunset']
      exiftool.XMP['Subject'] = ['beach', 'holiday']
      const meta = new Metadata(exiftool)
      should(meta.keywords).eql(['beach', 'sunset', 'holiday'])
    })
  })

  describe('rating', function () {
    it('defaults to a rating of 0', function () {
      const exiftool = fixtures.exiftool()
      const meta = new Metadata(exiftool)
      should(meta.rating).eql(0)
    })

    it('reads the rating from the XMP tags', function () {
      const exiftool = fixtures.exiftool()
      exiftool.XMP['Rating'] = 3
      const meta = new Metadata(exiftool)
      should(meta.rating).eql(3)
    })
  })

  describe('favourite', function () {
    it('defaults to false', function () {
      const exiftool = fixtures.exiftool()
      const meta = new Metadata(exiftool)
      should(meta.favourite).eql(false)
    })

    it('understands the Picasa <star> feature', function () {
      const exiftool = fixtures.exiftool()
      const picasa = { star: 'yes' }
      const meta = new Metadata(exiftool, picasa)
      should(meta.favourite).eql(true)
    })
  })

  describe('size', function () {
    it('can get an image width and height', function () {
      const exiftool = fixtures.exiftool()
      exiftool.Composite = { ImageSize: '800x600' }
      const meta = new Metadata(exiftool)
      should(meta.width).eql(800)
      should(meta.height).eql(600)
    })

    it('defaults to null when there is no Composite data', function () {
      const exiftool = fixtures.exiftool()
      const meta = new Metadata(exiftool)
      should(meta.width).eql(null)
      should(meta.width).eql(null)
    })

    it('defaults to null when there is no ImageSize data', function () {
      const exiftool = fixtures.exiftool()
      exiftool.Composite = { Other: 'Data' }
      const meta = new Metadata(exiftool)
      should(meta.width).eql(null)
      should(meta.width).eql(null)
    })
  })
})

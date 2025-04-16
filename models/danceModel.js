const Datastore = require('gray-nedb');
const { danceDbPath } = require('../config/database');

class DanceModel {
  constructor(dbFilePath) {
    this.db = dbFilePath 
      ? new Datastore({ filename: dbFilePath, autoload: true })
      : new Datastore();
  }

  async init() {
    try {
      const courses = await this.findByType('course');

      if (courses && courses.length > 0) {
        console.log(`Database already initialized with ${courses.length} courses`);
        return;
      }

      console.log('Initializing database with sample data...');

      await this.insertSampleData();
      
    } catch (err) {
      throw err;
    }
  }

  async insertSampleData() {
    const courseData = [
      {
        type: 'course',
        name: 'Beginner Salsa',
        duration: '8 weeks',
        createdAt: new Date(),
      },
      {
        type: 'course',
        name: 'Intermediate Ballet',
        duration: '12 weeks',
        createdAt: new Date(),
      },
      {
        type: 'course',
        name: 'Hip Hop Fundamentals',
        duration: '6 weeks',
        createdAt: new Date(),
      }
    ];

    const classData = [
      {
        type: 'class',
        courseName: 'Beginner Salsa',
        date: new Date('2025-05-01'),
        time: '18:00-19:30',
        description: 'Introduction to basic steps and rhythm',
        location: 'Studio A',
        price: 25.0,
        capacity: 20,
        spacesRemaining: 20,
        bookings: [],
        createdAt: new Date(),
      },
      {
        type: 'class',
        courseName: 'Beginner Salsa',
        date: new Date('2025-05-08'),
        time: '18:00-19:30',
        description: 'Partners work and simple turns',
        location: 'Studio A',
        price: 25.0,
        capacity: 20,
        spacesRemaining: 20,
        bookings: [],
        createdAt: new Date(),
      },
      {
        type: 'class',
        courseName: 'Intermediate Ballet',
        date: new Date('2025-05-02'),
        time: '17:00-18:30',
        description: 'Barre work and technique review',
        location: 'Studio B',
        price: 30.0,
        capacity: 15,
        spacesRemaining: 15,
        bookings: [],
        createdAt: new Date(),
      },
      {
        type: 'class',
        courseName: 'Hip Hop Fundamentals',
        date: new Date('2025-05-03'),
        time: '19:00-20:30',
        description: 'Basic footwork and isolations',
        location: 'Studio C',
        price: 28.0,
        capacity: 25,
        spacesRemaining: 25,
        bookings: [],
        createdAt: new Date(),
      },
      {
        type: 'class',
        courseName: 'Hip Hop Fundamentals',
        date: new Date('2025-05-10'),
        time: '19:00-20:30',
        description: 'Basic footwork and isolations',
        location: 'Studio C',
        price: 28.0,
        capacity: 25,
        spacesRemaining: 25,
        bookings: [],
        createdAt: new Date(),
      },
      {
        type: 'class',
        courseName: 'Hip Hop Fundamentals',
        date: new Date('2025-05-17'),
        time: '19:00-20:30',
        description: 'Basic footwork and isolations',
        location: 'Studio C',
        price: 28.0,
        capacity: 25,
        spacesRemaining: 25,
        bookings: [],
        createdAt: new Date(),
      },
      {
        type: 'class',
        courseName: 'Hip Hop Fundamentals',
        date: new Date('2025-05-24'),
        time: '19:00-20:30',
        description: 'Basic footwork and isolations',
        location: 'Studio C',
        price: 28.0,
        capacity: 25,
        spacesRemaining: 25,
        bookings: [],
        createdAt: new Date(),
      },
      {
        type: 'class',
        courseName: 'Hip Hop Fundamentals',
        date: new Date('2025-05-31'),
        time: '19:00-20:30',
        description: 'Basic footwork and isolations',
        location: 'Studio C',
        price: 28.0,
        capacity: 25,
        spacesRemaining: 25,
        bookings: [],
        createdAt: new Date(),
      }
    ];

    for (const course of courseData) {
      await this.insertRecord(course);
    }

    for (const classItem of classData) {
      await this.insertRecord(classItem);
    }
  }

  insertRecord(record) {
    return new Promise((resolve, reject) => {
      this.db.insert(record, (err, newRecord) => {
        if (err) {
          reject(err);
        } else {
          resolve(newRecord);
        }
      });
    });
  }

  findByType(type) {
    return new Promise((resolve, reject) => {
      this.db.find({ type }, (err, records) => {
        if (err) {
          reject(err);
        } else {
          resolve(records);
        }
      });
    });
  }

  async getAllCourses() {
    return this.findByType('course');
  }

  async getCourseById(courseId) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ type: 'course', _id: courseId }, (err, course) => {
        if (err) {
          reject(err);
        } else {
          resolve(course);
        }
      });
    });
  }

  async getClassesByCourseId(courseId) {
    try {
      const course = await this.getCourseById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      return new Promise((resolve, reject) => {
        this.db.find(
          { type: 'class', courseName: course.name },
          (err, classes) => {
            if (err) {
              reject(err);
            } else {
              resolve(classes);
            }
          },
        );
      });
    } catch (err) {
      throw err;
    }
  }

  async bookEntireCourse(courseId, bookingInfo) {
    try {
      const course = await this.getCourseById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      const classes = await this.getClassesByCourseId(courseId);
      if (!classes || classes.length === 0) {
        throw new Error('No classes found for this course');
      }

      const availableClasses = classes.filter(classItem => classItem.spacesRemaining > 0);
      const fullClasses = classes.filter(classItem => classItem.spacesRemaining <= 0);

      const fullClassFailures = fullClasses.map(classItem => ({
        success: false,
        classId: classItem._id,
        date: classItem.date,
        time: classItem.time,
        error: 'No spaces remaining in this class',
      }));
      
      const bookingPromises = availableClasses.map((classItem) => {
        return this.bookClass(classItem._id, bookingInfo).catch((err) => {
          return {
            success: false,
            classId: classItem._id,
            date: classItem.date,
            time: classItem.time,
            error: err.message,
          };
        });
      });

      const results = await Promise.all(bookingPromises);
      const allResults = [...results, ...fullClassFailures];
      
      const successful = allResults.filter((result) => result.success).length;
      const failed = allResults.filter((result) => !result.success);

      return {
        success: successful > 0,
        message: `Successfully booked ${successful} class(es)${failed.length > 0 ? `, with ${failed.length} failed booking(s)` : ''}`,
        totalClasses: allResults.length,
        successfulBookings: successful,
        failedBookings: failed.length > 0 ? failed : [],
      };
    } catch (err) {
      throw err;
    }
  }

  async bookClass(classId, bookingInfo) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ _id: classId }, (err, classData) => {
        if (err) {
          reject(err);
          return;
        }

        if (!classData) {
          reject(new Error('Class not found'));
          return;
        }

        if (classData.spacesRemaining <= 0) {
          reject(new Error('No spaces remaining in this class'));
          return;
        }

        if (
          classData.bookings &&
          classData.bookings.some(
            (booking) => booking.customerEmail === bookingInfo.customerEmail,
          )
        ) {
          reject(
            new Error(
              'You\'ve already booked this class with this email address. Please use a different email if booking for someone else.',
            ),
          );
          return;
        }

        const updatedClass = { ...classData };

        updatedClass.spacesRemaining = (updatedClass.spacesRemaining || 0) - 1;

        if (!updatedClass.bookings) {
          updatedClass.bookings = [];
        }

        updatedClass.bookings.push({
          bookingDate: new Date(),
          customerName: bookingInfo.customerName,
          customerEmail: bookingInfo.customerEmail,
          customerPhone: bookingInfo.customerPhone || '',
        });

        this.db.update(
          { _id: classId },
          updatedClass,
          {},
          (updateErr, numUpdated) => {
            if (updateErr) {
              reject(updateErr);
              return;
            }

            if (numUpdated === 0) {
              reject(new Error('Failed to update class. Please try again.'));
              return;
            }

            resolve({
              success: true,
              message: 'Booking successful',
            });
          },
        );
      });
    });
  }

  async updateCourse(courseId, updateData) {
    return new Promise((resolve, reject) => {
      if (!courseId) {
        reject(new Error('Course ID is required'));
        return;
      }

      const validUpdate = {};
      if (updateData.name) validUpdate.name = updateData.name;
      if (updateData.duration) validUpdate.duration = updateData.duration;
      validUpdate.updatedAt = new Date();

      this.db.update(
        { type: 'course', _id: courseId },
        { $set: validUpdate },
        { returnUpdatedDocs: true },
        (err, numUpdated, updatedCourse) => {
          if (err) {
            reject(err);
            return;
          }

          if (numUpdated === 0) {
            reject(new Error('Course not found or no changes were made'));
            return;
          }

          if (updateData.name) {
            this.getCourseById(courseId)
              .then((course) => {
                const oldName = course.name;
                this.db.update(
                  { type: 'class', courseName: oldName },
                  { $set: { courseName: updateData.name } },
                  { multi: true },
                  (updateErr, classesUpdated) => {
                    if (updateErr) {
                      // Error handled through Promise
                    } else {
                      console.log(`Updated courseName in ${classesUpdated} classes`);
                    }
                  },
                );
              })
              .catch((courseErr) => {
                // Error handled through Promise
              });
          }

          resolve({
            success: true,
            message: 'Course updated successfully',
            updatedCourse,
          });
        },
      );
    });
  }

  completeClassUpdate(classId, validUpdate, resolve, reject) {
    validUpdate.updatedAt = new Date();

    this.db.update(
      { _id: classId },
      { $set: validUpdate },
      { returnUpdatedDocs: true },
      (updateErr, numUpdated, updatedClass) => {
        if (updateErr) {
          reject(updateErr);
          return;
        }

        if (numUpdated === 0) {
          reject(new Error('No changes were made'));
          return;
        }

        resolve({
          success: true,
          message: 'Class updated successfully',
          updatedClass,
        });
      },
    );
  }
  
  async updateClass(classId, updateData) {
    return new Promise((resolve, reject) => {
      if (!classId) {
        reject(new Error('Class ID is required'));
        return;
      }

      this.db.findOne({ type: 'class', _id: classId }, (err, currentClass) => {
        if (err) {
          reject(err);
          return;
        }

        if (!currentClass) {
          reject(new Error('Class not found'));
          return;
        }

        const validUpdate = {};

        if (updateData.date) validUpdate.date = new Date(updateData.date);
        if (updateData.time) validUpdate.time = updateData.time;
        if (updateData.description) validUpdate.description = updateData.description;
        if (updateData.location) validUpdate.location = updateData.location;
        if (updateData.price) validUpdate.price = parseFloat(updateData.price);

        if (updateData.capacity !== undefined) {
          const currentBookings = currentClass.bookings ? currentClass.bookings.length : 0;
          if (updateData.capacity < currentBookings) {
            reject(new Error(`Cannot reduce capacity below current booking count (${currentBookings})`));
            return;
          }
          validUpdate.capacity = updateData.capacity;
          validUpdate.spacesRemaining = updateData.capacity - currentBookings;
        }

        if (updateData.courseName && updateData.courseName !== currentClass.courseName) {
          this.db.findOne({ type: 'course', name: updateData.courseName }, (courseErr, course) => {
            if (courseErr) {
              reject(courseErr);
              return;
            }

            if (!course) {
              reject(new Error(`Course '${updateData.courseName}' does not exist`));
              return;
            }

            validUpdate.courseName = updateData.courseName;
            this.completeClassUpdate(classId, validUpdate, resolve, reject);
          });
        } else {
          this.completeClassUpdate(classId, validUpdate, resolve, reject);
        }
      });
    });
  }
  
  async createCourse(courseData) {
    return new Promise((resolve, reject) => {
      if (!courseData.name || !courseData.duration) {
        reject(new Error('Course name and duration are required'));
        return;
      }
      
      this.db.findOne({ type: 'course', name: courseData.name }, (err, existingCourse) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (existingCourse) {
          reject(new Error(`A course with the name '${courseData.name}' already exists`));
          return;
        }
        
        const newCourse = {
          type: 'course',
          name: courseData.name.trim(),
          duration: courseData.duration.trim(),
          createdAt: new Date()
        };
        
        this.db.insert(newCourse, (insertErr, insertedCourse) => {
          if (insertErr) {
            reject(insertErr);
            return;
          }
          
          resolve({
            success: true,
            message: 'Course created successfully',
            course: insertedCourse
          });
        });
      });
    });
  }
  
  async createClass(classData) {
    return new Promise((resolve, reject) => {
      if (!classData.courseName || !classData.date || !classData.time || 
          !classData.description || !classData.location || 
          classData.price === undefined || classData.capacity === undefined) {
        reject(new Error('All class fields are required'));
        return;
      }
      
      this.db.findOne({ type: 'course', name: classData.courseName }, (err, course) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!course) {
          reject(new Error(`Course '${classData.courseName}' does not exist`));
          return;
        }
        
        const newClass = {
          type: 'class',
          courseName: classData.courseName,
          date: new Date(classData.date),
          time: classData.time.trim(),
          description: classData.description.trim(),
          location: classData.location.trim(),
          price: parseFloat(classData.price),
          capacity: parseInt(classData.capacity, 10),
          spacesRemaining: parseInt(classData.capacity, 10),
          bookings: [],
          createdAt: new Date()
        };
        
        this.db.insert(newClass, (insertErr, insertedClass) => {
          if (insertErr) {
            reject(insertErr);
            return;
          }
          
          resolve({
            success: true,
            message: 'Class created successfully',
            class: insertedClass
          });
        });
      });
    });
  }
  
  async getClassById(classId) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ type: 'class', _id: classId }, (err, classData) => {
        if (err) {
          reject(err);
        } else {
          resolve(classData);
        }
      });
    });
  }
  
  async getClassBookings(classId) {
    try {
      const classData = await this.getClassById(classId);
      if (!classData) {
        throw new Error('Class not found');
      }
      
      const bookings = classData.bookings || [];
      return {
        classId,
        className: classData.courseName,
        date: classData.date,
        time: classData.time,
        bookings
      };
    } catch (err) {
      throw err;
    }
  }

  async deleteCourse(courseId) {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    try {
      const course = await this.getCourseById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      const classes = await this.getClassesByCourseId(courseId);
      
      const deleteClassPromises = classes.map(classItem => {
        return new Promise((resolveClass, rejectClass) => {
          this.db.remove({ _id: classItem._id }, {}, (err, numRemoved) => {
            if (err) rejectClass(err);
            else resolveClass(numRemoved);
          });
        });
      });

      await Promise.all(deleteClassPromises);
      
      const numRemoved = await new Promise((resolveCourse, rejectCourse) => {
        this.db.remove({ type: 'course', _id: courseId }, {}, (err, numRemoved) => {
          if (err) {
            rejectCourse(err);
          } else if (numRemoved === 0) {
            rejectCourse(new Error('Failed to delete course'));
          } else {
            resolveCourse(numRemoved);
          }
        });
      });

      return {
        success: true,
        message: 'Course and all associated classes deleted successfully'
      };
    } catch (err) {
      throw err;
    }
  }

  async deleteClass(classId) {
    return new Promise((resolve, reject) => {
      if (!classId) {
        reject(new Error('Class ID is required'));
        return;
      }

      this.db.remove({ type: 'class', _id: classId }, {}, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else if (numRemoved === 0) {
          reject(new Error('Class not found or could not be deleted'));
        } else {
          resolve({
            success: true,
            message: 'Class deleted successfully'
          });
        }
      });
    });
  }
  
  async removeBooking(classId, bookingEmail) {
    if (!classId || !bookingEmail) {
      throw new Error('Class ID and booking email are required');
    }

    try {
      const classData = await this.getClassById(classId);
      if (!classData) {
        throw new Error('Class not found');
      }

      const updatedClass = { ...classData };
      const initialBookingsCount = updatedClass.bookings ? updatedClass.bookings.length : 0;
      
      if (updatedClass.bookings && updatedClass.bookings.length > 0) {
        updatedClass.bookings = updatedClass.bookings.filter(
          booking => booking.customerEmail !== bookingEmail
        );
      }

      if (initialBookingsCount === (updatedClass.bookings ? updatedClass.bookings.length : 0)) {
        throw new Error('Booking not found for the provided email');
      }

      updatedClass.spacesRemaining = (updatedClass.spacesRemaining || 0) + 1;

      return new Promise((resolve, reject) => {
        this.db.update(
          { _id: classId },
          updatedClass,
          {},
          (updateErr, numUpdated) => {
            if (updateErr) {
              reject(updateErr);
            } else if (numUpdated === 0) {
              reject(new Error('Failed to update class after removing booking'));
            } else {
              resolve({
                success: true,
                message: 'Booking removed successfully'
              });
            }
          }
        );
      });
    } catch (err) {
      throw err;
    }
  }
}

const danceModel = new DanceModel(danceDbPath);
danceModel
  .init()
  .then(() => {
    console.log('Dance model initialized');
  })
  .catch((err) => {
    console.error('Error initializing dance model:', err);
  });

module.exports = danceModel;
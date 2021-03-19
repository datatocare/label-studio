"""Database models."""
from . import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash


class User(UserMixin, db.Model):
    """User account model."""

    __tablename__ = 'user'
    id = db.Column(
        db.Integer,
        primary_key=True
    )
    name = db.Column(
        db.String(100),
        nullable=False,
        unique=False
    )
    username = db.Column(
        db.String(100),
        nullable=False,
        unique=False
    )

    type = db.Column(
    	db.String(40),
        default="normal",
    	# unique=True,
    	# nullable=False
    )

    password = db.Column(
        db.String(200),
        primary_key=False,
        unique=False,
        nullable=False
    )
    created_on = db.Column(
        db.DateTime,
        index=False,
        unique=False,
        nullable=True
    )
    last_login = db.Column(
        db.DateTime,
        index=False,
        unique=False,
        nullable=True
    )

    is_admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        """Create hashed password."""
        self.password = generate_password_hash(password, method='sha256')

    def check_password(self, password):
        """Check hashed password."""
        return check_password_hash(self.password, password)

    def __repr__(self):
        return '<User {}>'.format(self.username)


class Task(db.Model):
    __tablename__ = 'task'

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    text = db.Column(
        db.String(2000),
        nullable=False,
        unique=False
    )

    # todo add batch id
    #
    # layout = db.Column(
    #     db.String(2000),
    #     nullable=False,
    #     unique=False
    # )

    layout_id = db.Column(db.Integer, db.ForeignKey('layout.id'),
                          nullable=False)
    groundTruth = db.Column(
        db.String(2000),
        nullable=False,
        unique=False
    )

    format_type = db.Column(db.Integer, default=0)
    batch_id = db.Column(db.Integer, default=0)
    description = db.Column(
        db.String(2000)
    )


class Completion(db.Model):
    __tablename__ = 'completions'
    id = db.Column(
        db.Integer,
        primary_key=True
    )
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    data = db.Column(
        db.String(2000),
        nullable=False,
        unique=False
    )

    # hexID =db.Column(
    #     db.String(2000),
    #     default="",
    #     nullable=False,
    #     unique=False
    # )
    completed_at = db.Column(
        db.BigInteger
        # default="",
        # nullable=False,
        # unique=False
    )


class OldCompletion(db.Model):
    __tablename__ = 'Oldcompletions'
    id = db.Column(
        db.Integer,
        primary_key=True
    )
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    data = db.Column(
        db.String(2000),
        nullable=False,
        unique=False
    )

    # hexID =db.Column(
    #     db.String(2000),
    #     default="",
    #     nullable=False,
    #     unique=False
    # )
    completed_at = db.Column(
        db.BigInteger
        # default="",
        # nullable=False,
        # unique=False
    )

class Layout(db.Model):
    __tablename__ = 'layout'
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    data = db.Column(
        db.String(2000),
        nullable=False,
        unique=False
    )


class UserScore(db.Model):
    __tablename__ = 'user_score'
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(db.Integer)
    batch_id = db.Column(db.Integer)
    score = db.Column(db.Float)
    showDemo = db.Column(db.Boolean, default=True)
    current_task_type = db.Column(db.Integer)


class TrainingTask(db.Model):
    __tablename__ = 'TrainingTask'
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    text = db.Column(
        db.String(2000),
        nullable=False,
        unique=False
    )

    data = db.Column(
        db.String(2000),
        nullable=False,
        unique=False
    )

    layout_id = db.Column(db.Integer, db.ForeignKey('layout.id'),
                          nullable=False)
    groundTruth = db.Column(
        db.String(2000),
        nullable=False,
        unique=False
    )

    format_type = db.Column(db.Integer, default=0)
    batch_id = db.Column(db.Integer, default=0)
    description = db.Column(
        db.String(2000)
    )

class BatchData(db.Model):
    __tablename__ = 'BatchData'
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    data = db.Column(
        db.String(2000),
        nullable=False,
    )

    hexID = db.Column(
        db.String(2000),
        nullable=False,
    )

    Type = db.Column(
        db.String(2000),
        nullable=False,
    )

class TrainingTaskCompletions(db.Model):
    __tablename__ = 'TrainingTaskCompletions'
    id = db.Column(
        db.Integer,
        primary_key=True
    )
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('TrainingTask.id'), nullable=False)
    data = db.Column(
        db.String(2000),
        nullable=False,
        unique=False
    )

    completed_at = db.Column(
        db.BigInteger
    )


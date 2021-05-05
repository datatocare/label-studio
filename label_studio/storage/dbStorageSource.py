from .base import BaseStorage
import logging
import os
from label_studio.models import Task, Completion, OldCompletion, UserScore, TrainingTask
from label_studio import db
from label_studio.utils.io import json_load
from sqlalchemy import func
import json

logger = logging.getLogger(__name__)


def checkAndgetTrainginTask(userID, batchid):
    q = db.session.query(Task.id).filter(Task.batch_id == batchid, Task.format_type == 1).subquery()
    # Task1 = db.session.query(Completion.task_id).filter(Completion.user_id == userID, Completion.task_id.in_(
    #     q))  # .delete(synchronize_session='fetch')
    # q1 = db.session.query(Task.id).filter(Task.batch_id == batchid, Task.format_type == 1).all()
    # for i in q1:
    #     print(i)
    # Taskidcompleted = db.session.query(Completion.task_id).filter(Completion.user_id == userID, Completion.task_id.in_(
    #     q)).subquery()  # .delete(synchronize_session='fetch')
    Taskcount = db.session.query(func.count(Completion.id)).filter(Completion.user_id == userID, Completion.task_id.in_(
        q)).scalar()  # .delete(synchronize_session='fetch')

    if Taskcount >= 2:
        print("Here 3", Taskcount)
        w = db.session.query(Completion).filter(Completion.user_id == userID,
                                                Completion.task_id.in_(q)).all()  # .delete(synchronize_session='fetch')
        for r in w:
            oldc = OldCompletion(user_id=r.user_id, task_id=r.task_id, data=r.data, completed_at=r.completed_at)
            db.session.add(oldc)
            db.session.delete(r)
        db.session.commit()
    # nextTask = db.session.query(Task).filter(Task.batch_id==batchid, Task.format_type == 1, Task.id.notin_(Taskidcompleted)).first()
        nextTask = db.session.execute(
            'SELECT * FROM TrainingTask WHERE batch_id=:batchid and TrainingTask.format_type == 1 and '
            'id not in (select task_id from completions where user_id = :userID and '
            'task_id in (select id from TrainingTask where batch_id= :batchid and TrainingTask.format_type == 1) ) order by id',
            {'userID': userID,'batchid':batchid }).first()
    # nextTask = db.session.execute(
    #     'SELECT * FROM TrainingTask WHERE batch_id=:batchid and format_type == 1 ',
    #     {'userID': userID, 'batchid': batchid}).first()

    return nextTask


class JsonDBStorage(BaseStorage):

    description = 'JSON task file'
    def __init__(self, **kwargs):
        super(JsonDBStorage, self).__init__(**kwargs)
        if not self.importFromFile:
            logger.debug("returning flag set")
            return
        logger.debug("reading from File")
        Alltasks = {}
        if os.path.exists(self.path):
            Alltasks = json_load(self.path, int_keys=True)
        # logger.debug(Alltasks)
        # logger.debug(type(Alltasks))
        if len(Alltasks) != 0:
            for i, task in Alltasks.items():
                try:
                    # existing_task = Task.query.filter_by(username=username).first()
                    # if existing_task is None:
                    # logger.debug(SubTask)

                    # for task in SubTask:
                    # task = Alltasks[SubTask]
                    # logger.debug(type(task))
                    # logger.debug(task["data"])

                    dbtask = Task(text= task["data"]["text"], layout=task["data"]["layout"], groundTruth=task["data"]["groundTruth"])
                    db.session.add(dbtask)
                    db.session.commit()
                except Exception as e:
                    logger.debug("Storage db Error 3 ")
                    logger.debug(e)
        #     self.data = {}
        # elif isinstance(tasks, dict):
        #     self.data = tasks
        # elif isinstance(self.data, list):
        #     self.data = {int(task['id']): task for task in tasks}
        # self._save()

    # def _save(self):
    #     with open(self.path, mode='w', encoding='utf8') as fout:
            # json.dump(self.data, fout, ensure_ascii=False)


    @property
    def readable_path(self):
        return self.path

    def get(self, id):
        existing_task = Task.query.filter_by(id=id).first()
        if existing_task is not None:
            return existing_task
        return None
        # return self.data.get(int(id))

    def set(self, id, value):
        task = self.get(id)
        if task is not None:
            task.text = value["text"]
            task.layout = value["layout"]
            task.groundTruth = value["groundTruth"]
            # db.session.merge(task)
            db.session.commit()
        else:
            try:
                dbtask = Task(id=id,text=task["data"]["text"], layout=task["data"]["layout"],
                              groundTruth=task["data"]["groundTruth"])
                db.session.add(dbtask)
                db.session.commit()
            except Exception as e:
                logger.debug("Storage db Error ")
                logger.debug(e)
        # self.data[int(id)] = value
        # self._save()

    def __contains__(self, id):
        return self.get(id)
        # return id in self.data

    def set_many(self, ids, values):
        for id, value in zip(ids, values):
            self.set(id,value)
            # self.data[int(id)] = value
        # self._save()

    def ids(self):
        results = db.session.query(Task.id).all()
        return [value for value, in results]
        # return self.data.keys()

    def max_id(self):
        return db.session.query(db.func.max(Task.id)).scalar()
        # return max(self.ids(), default=-1)

    def items(self):
        return
        # return self.data.items()

    # def nextTask(self, userID, traingTask, batchid):
    def nextTask(self, userID, taskType, batchid):
        # db.session.query()
        nextTask = None
        # showDemo = 0

        # userDemoFlag = UserScore.query.filter_by(user_id=userID, batch_id=batchid).first()
        # if userDemoFlag == None or userDemoFlag.showDemo == True or traingTask == '1':
        #     nextTask = checkAndgetTrainginTask(userID, batchid)
            # nextTask = db.session.execute(
            #     'SELECT * FROM TrainingTask WHERE id not in (select task_id from completions where user_id = :userID ) order by id',
            #       {'userID': userID}).first()
            # showDemo = 1
        # else:
            # print("Here 5")
            # print("Here 1")
            # print(userScore)
            # if userScore < 20:
            #     nextTask = checkAndgetTrainginTask(userID)
            # else:
            # nextTask = db.session.execute(
            #     'SELECT * FROM task WHERE  id not in (select task_id from completions where user_id = :userID ) and batch_id = :batchid  order by id',
            #     {'userID': userID, 'batchid': batchid}).first()
            # nextTask = db.session.execute(
            #     'SELECT * FROM task WHERE  id not in (select task_id from completions where user_id = :userID ) ' +
            #     'and batch_id = :batchid  order by id',
            #     {'userID': userID, 'batchid': batchid}).first()

        # logger.debug(nextTask)
        # logger.debug(type(nextTask))
        # for r in nextTask:
            # print(r[0])  # Access by positional index
            # print(r['my_column'])  # Access by column name as a string
            # r_dict = dict(r.items())  # convert to dict keyed by column names
            #  return r.__dict_
        # if taskType in (1, 2):
        #     nextTask = db.session.execute(
        #         'SELECT * FROM task WHERE id in (select task_id from completions where user_id != :userID ) and id not in (select task_id from completions where user_id = :userID ) and batch_id = :batchid and format_type = :taskType order by RANDOM() LIMIT 1',
        #         {'userID': userID, 'batchid': batchid, 'taskType': taskType}).first() #and id not in (select task_id from completions where user_id = :userID )
        #     if nextTask is None:
        #         nextTask = db.session.execute(
        #                'SELECT * FROM task WHERE id not in (select task_id from completions where user_id = :userID ) and batch_id = :batchid and format_type = :taskType order by RANDOM() LIMIT 1',
        #             {'userID': userID, 'batchid': batchid, 'taskType': taskType}).first()
        if taskType in (1,2,3, 4):
            nextTask = db.session.execute(
                'SELECT * FROM task WHERE id in (select task_id from completions where completions.user_id = 0 and completions.batch_id = :batchid ) and id not in (select task_id from completions where user_id = :userID  and completions.batch_id = :batchid) and batch_id = :batchid and format_type = :taskType order by id LIMIT 1', #random()
                {'userID': userID, 'batchid': batchid, 'taskType': 1}).first()
            # if nextTask is None:
            #     nextTask = db.session.execute(
            #            'SELECT * FROM task WHERE id not in (select task_id from completions where user_id = :userID ) and batch_id = :batchid and format_type = :taskType order by RANDOM() LIMIT 1',
            #         {'userID': userID, 'batchid': batchid, 'taskType': taskType}).first()
        elif taskType in (5, 6):
            nextTask = db.session.execute(
                # 'SELECT * FROM task WHERE id NOT in (select task_id from completions where completions.user_id = 0 and completions.batch_id = :batchid ) and id not in (select task_id from completions where user_id = :userID and completions.batch_id = :batchid ) and batch_id = :batchid and format_type = :taskType order by id LIMIT 1',
                'SELECT * FROM task WHERE id not in (select task_id from completions where user_id = :userID and completions.batch_id = :batchid ) and batch_id = :batchid and format_type = :taskType order by id LIMIT 1',
                {'userID': userID, 'batchid': batchid, 'taskType': 1}).first()

        # TODO : Check if completion is empty the re elect task

        if nextTask is None:
            return None
        dictTask = dict(nextTask.items())
        completed_at_data = db.session.execute(
            'select id,task_id,data,completed_at from completions where task_id = :id',
            {'id': nextTask.id}).first()

        if completed_at_data is not None:
            completionData = json.loads(completed_at_data.data)
            completionData['id'] = completed_at_data.id
            # logger.debug(json.dumps(completionData, indent=2))
            dictTask["completions"] = [completionData]  # [json.loads(completion.data)]
            dictTask['completed_at'] = completed_at_data.completed_at

        # if 'result' in dictTask:
        #     completionData = json.loads(dictTask['result'])
        #     completionData['id'] = completionData['id']
        #     # logger.debug(json.dumps(completionData, indent=2))
        #     dictTask["completions"] = [completionData]  # [json.loads(completion.data)]
        #     # dictTask['completed_at'] = completionData['completed_at']
        # dictTask["showDemo"] = showDemo
        return dictTask

    def remove(self, key):
        task = self.get(int(key))
        if task is not None:
            db.session.delete(task)
        # self.data.pop(int(key), None)
        # self._save()

    def remove_all(self):
        return
        # self.data = {}
        # self._save()

    def empty(self):
        return False
        # return len(self.data) == 0

    def sync(self):
        pass


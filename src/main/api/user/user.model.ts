import mysql from 'mysql';
import crypto from 'crypto';

import { CoreDocument } from "../../../types/model.type";
import { ModelBase } from "../../../bases/model.base";
import { db } from "../../../database/database"
import { ModelStatus } from "../../../types/response.type";
import { OkPacket, RowDataPacket } from "mysql2";
import { resolve } from 'path/posix';

const UserSchema = {
    username: {
        type: String,
        isOption: false,
    },
    account: {
        type: String,
        isOption: false,
    },
    password: {
        type: String,
        isOption: false,
    },
    phone: {
        type: String,
        isOption: true
    },
}

export interface UserDocument extends CoreDocument {
    uid: number;
    username: string;
    account: string;
    password: string;
    phone: string;
}

export class UserModel extends ModelBase implements UserDocument {
    public uid!: number;
    public username!: string;
    public account!: string;
    public password!: string;
    private hash!:string;
    private salt!: string;
    public phone!: string;

    public createdAt!: Date;
    public updatedAt!: Date;

    constructor(data: any = {}) {
        super();
        this.uid = data.uid;
        this.username = data.username;
        this.account = data.account;
        this.password = data.password;
        this.hash = data.hash;
        this.salt = data.salt;
        this.phone = data.phone;
        this.createdAt = data.created_At;
        this.updatedAt = data.updated_At;
    }

    // @Public funciton
    public async getUser(){ //: Promise<UserModel> {
        console.log("Model getUser", this.account);
        const queryString = "SELECT * FROM `User` WHERE `account`=?";
        return new Promise((resolve) => {
            db.query(
                queryString,
                this.account,
                (err, result) => {
                    if(err) {
                        throw err;
                    }

                    const row = (<RowDataPacket> result)[0];
                    console.log(row);
                    resolve(new UserModel(row))
                }
            )
        })
    }

    public async getUsers(limit: number) {
        const queryString = "SELECT * FROM `User` WHERE `account`=?";
        return new Promise((resolve, reject) => {
            db.query(
                queryString,
                this.account,
                (err, result) => {
                    if(err) reject(err);

                    const row = (<RowDataPacket> result)[0]
                    // console.log(row);
                    resolve(row)
                    // resolve({data: result, status: ModelStatus.SUCCESS});
                    // return result;
                }
            )
        })
    }

    public async updateUser(){
        console.log("Model getUser", this.account);
        var salt = this.salt
        var hash = this.hash
        if(this.password != undefined){
            var {salt, hash} = this.hashPassword(this.password, this.salt);
        }
            
        console.log(this)
        const queryString = "UPDATE `User` SET `account`=?,`hash`=?,`salt`=?,`username`=?,`phone`=? WHERE `uid`=?";
        return new Promise((resolve) => {
            db.query(
                queryString,
                [this.account, hash, salt, this.username, this.phone, this.uid],
                (err, result) => {
                    if(err) {
                        throw err;
                    }

                    const row = (<RowDataPacket> result)[0];
                    console.log(row);
                    // resolve(new UserModel(row))
                }
            )
        })
    }

    public async deleteUser() {
        console.log("Model deleteUser", this.uid);
        const queryString = "DELETE FROM `User` WHERE `uid`=?";
        return new Promise((resolve, reject) => {
            db.query(
                queryString,
                [this.uid],
                (err, result) => {
                    if(err){
                        reject(err);
                    }

                    const OkData = (<OkPacket> result)

                    console.log(OkData);

                    resolve(OkData);
                }
            )
        });
    }

    public async createUser(): Promise<UserModel>{
        const {salt, hash} = this.hashPassword(this.password);
        const queryString = "INSERT INTO `User`(`account`, `username`, `hash`, `salt`) VALUES (?, ?, ?, ?)";
        return new Promise((resolve, reject) => {
            db.query(
                queryString,
                [this.account, this.username, hash, salt],
                (err, result) => {
                    if(err){
                        reject(err);
                    }

                    const insertID = (<OkPacket> result).insertId;

                    resolve(new UserModel({uid: insertID}));
                }
            )
        });
    }

    // @Private Function
    public hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): { salt: string, hash: string}{
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
        return {salt, hash};
    }

    public verifyPassword(password: string):boolean {
        const {salt, hash} = this.hashPassword(password, this.salt)
        return hash == this.hash;
    }
}